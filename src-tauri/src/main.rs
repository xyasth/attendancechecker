#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Serialize, Deserialize};
use tauri::{State, Manager}; // Added Manager
use std::collections::HashMap; // For ChromaDB metadata and responses
use chrono::{Utc, DateTime, Timelike, Datelike}; // For date handling

// --- Database (using sqlx for Neon Postgres) ---
// Note: You MUST provide your Neon connection string via DATABASE_URL environment variable
use sqlx::postgres::{PgPool, PgPoolOptions};

// --- HTTP Client (using reqwest for ChromaDB) ---
use reqwest::{Client, header::{HeaderMap, HeaderValue, AUTHORIZATION}};

// --- State Management ---
struct AppState {
    db_pool: PgPool,
    http_client: Client,
    chroma_api_url: String, // Base URL like "https://api.trychroma.com"
    chroma_collection_name: String, // e.g., "attendance_faces"
}

// --- Data Structures ---
// Matches frontend payload for registration
#[derive(Deserialize, Debug)]
struct RegisterPayload {
    name: String,
    email: String,
    embeddings: Vec<Vec<f32>>,
}

// User info returned after successful operations
#[derive(Serialize, Debug, Clone)]
struct UserInfo {
    id: String, // Changed from uuid::Uuid to String for simplicity with DB ID
    name: String,
    email: String,
}

// Response for registration command
#[derive(Serialize, Debug)]
struct RegisterResponse {
    success: bool,
    user: Option<UserInfo>,
    error: Option<String>,
}

// Matches frontend payload for check-in
#[derive(Deserialize, Debug)]
struct CheckinPayload {
    embeddings: Vec<f32>,
}

// Response for check-in command
#[derive(Serialize, Debug)]
struct CheckinResponse {
    success: bool,
    message: String,
    user: Option<UserInfo>,
    error: Option<String>,
}

// Data for admin attendance list
#[derive(Serialize, Debug, sqlx::FromRow)] // Added sqlx::FromRow
struct EmployeeAttendance {
    id: String, // Assuming cuid() generates a String ID
    name: String,
    email: String,
    attended: Option<bool>, // Option<bool> handles employees without attendance records for the day
}

// --- ChromaDB API Structures ---
// Structure for adding embeddings to ChromaDB
#[derive(Serialize)]
struct ChromaAddPayload<'a> {
    ids: Vec<String>,
    embeddings: &'a Vec<Vec<f32>>,
    metadatas: Vec<HashMap<String, String>>,
}

// Structure for querying embeddings from ChromaDB
#[derive(Serialize)]
struct ChromaQueryPayload<'a> {
    #[serde(rename = "queryEmbeddings")]
    query_embeddings: &'a Vec<Vec<f32>>, // Chroma expects [[embedding]]
    #[serde(rename = "nResults")]
    n_results: u32,
    // include: Vec<String>, // Optional: ["metadatas", "distances"]
}

// Structure for ChromaDB query response (simplified)
#[derive(Deserialize, Debug)]
struct ChromaQueryResponse {
    ids: Option<Vec<Vec<String>>>,
    metadatas: Option<Vec<Vec<HashMap<String, serde_json::Value>>>>,
    distances: Option<Vec<Vec<f32>>>, // Useful for setting a threshold
}


// --- Utility Functions ---
fn create_error_response<T>(msg: &str) -> Result<T, String> {
    eprintln!("Error: {}", msg); // Log error to console
    Err(msg.to_string())
}

// --- Tauri Commands ---

#[tauri::command]
async fn register_user(
    payload: RegisterPayload,
    state: State<'_, AppState>,
) -> Result<RegisterResponse, String> {
    println!("Registering user command called for: {}", payload.email);

    // --- Database: Create User ---
    let user_creation_result = sqlx::query!(
        r#"
        INSERT INTO "User" (name, email)
        VALUES ($1, $2)
        RETURNING id, name, email
        "#,
        payload.name,
        payload.email
    )
    .fetch_one(&state.db_pool)
    .await;

    let created_user = match user_creation_result {
        Ok(record) => UserInfo {
            id: record.id, // Prisma default cuid is String
            name: record.name,
            email: record.email,
        },
        Err(e) => {
            // Handle potential unique constraint violation etc.
            return Ok(RegisterResponse {
                success: false,
                user: None,
                error: Some(format!("Database error creating user: {}", e)),
            });
        }
    };

    // --- ChromaDB: Add Embeddings ---
    let ids: Vec<String> = payload.embeddings
        .iter()
        .enumerate()
        .map(|(idx, _)| format!("{}-{}", created_user.id, idx))
        .collect();

    let metadatas: Vec<HashMap<String, String>> = payload.embeddings
        .iter()
        .map(|_| {
            let mut map = HashMap::new();
            map.insert("name".to_string(), created_user.name.clone());
            map.insert("email".to_string(), created_user.email.clone());
            map
        })
        .collect();

    let chroma_payload = ChromaAddPayload {
        ids,
        embeddings: &payload.embeddings,
        metadatas,
    };

    let add_url = format!(
        "{}/api/v1/collections/{}/add",
        state.chroma_api_url, state.chroma_collection_name
    );

    let chroma_res = state.http_client
        .post(&add_url)
        .json(&chroma_payload)
        .send()
        .await;

    match chroma_res {
        Ok(response) => {
            if !response.status().is_success() {
                 let error_body = response.text().await.unwrap_or_else(|_| "Failed to read ChromaDB error body".to_string());
                // Consider rolling back DB user creation here if desired
                return Ok(RegisterResponse {
                    success: false,
                    user: None, // Or Some(created_user) if you don't roll back
                    error: Some(format!("ChromaDB add failed: {}", error_body)),
                });
            }
            println!("Embeddings added successfully to ChromaDB for user {}", created_user.id);
        }
        Err(e) => {
             // Consider rolling back DB user creation here if desired
            return Ok(RegisterResponse {
                success: false,
                user: None, // Or Some(created_user) if you don't roll back
                error: Some(format!("Error sending request to ChromaDB: {}", e)),
            });
        }
    }

    Ok(RegisterResponse {
        success: true,
        user: Some(created_user),
        error: None,
    })
}

#[tauri::command]
async fn checkin_user(
    payload: CheckinPayload,
    state: State<'_, AppState>,
) -> Result<CheckinResponse, String> {
     println!("Check-in command called");
     const DISTANCE_THRESHOLD: f32 = 0.6; // Example threshold (lower means stricter match)

    // --- ChromaDB: Query Embedding ---
    let query_url = format!(
        "{}/api/v1/collections/{}/query",
        state.chroma_api_url, state.chroma_collection_name
    );

    // ChromaDB query API expects a list of embeddings to query
    let query_embeddings_payload = vec![payload.embeddings];

    let chroma_payload = ChromaQueryPayload {
        query_embeddings: &query_embeddings_payload,
        n_results: 1,
        // include: vec!["metadatas".to_string(), "distances".to_string()], // Request distances
    };

    let chroma_res = state.http_client
        .post(&query_url)
        .json(&chroma_payload)
        .send()
        .await;

    let (matched_email, matched_distance) = match chroma_res {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<ChromaQueryResponse>().await {
                    Ok(data) => {
                        // Extract email and distance
                         let first_match_metadata = data.metadatas.as_ref()
                            .and_then(|m| m.get(0))
                            .and_then(|inner| inner.get(0));
                        let first_match_distance = data.distances.as_ref()
                            .and_then(|d| d.get(0))
                            .and_then(|inner| inner.get(0));

                        let email = first_match_metadata
                            .and_then(|meta| meta.get("email"))
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());

                        (email, first_match_distance.cloned()) // Clone the distance value
                    }
                    Err(e) => return create_error_response(&format!("Failed to parse ChromaDB response: {}", e)),
                }
            } else {
                 let error_body = response.text().await.unwrap_or_else(|_| "Failed to read ChromaDB error body".to_string());
                return create_error_response(&format!("ChromaDB query failed: {}", error_body));
            }
        }
        Err(e) => return create_error_response(&format!("Error sending query to ChromaDB: {}", e)),
    };

    let matched_email = match matched_email {
        Some(email) => email,
        None => return Ok(CheckinResponse { // Return Ok, but indicate no match
            success: false,
            message: "No matching face found.".to_string(),
            user: None,
            error: Some("No match found in vector database".to_string()),
        }),
    };

     // Check distance threshold if available
    if let Some(distance) = matched_distance {
        println!("Match distance: {}", distance);
        if distance > DISTANCE_THRESHOLD {
             return Ok(CheckinResponse {
                success: false,
                message: "Match found, but confidence too low.".to_string(),
                user: None,
                error: Some(format!("Distance {} exceeds threshold {}", distance, DISTANCE_THRESHOLD)),
            });
        }
    } else {
        println!("Warning: Distance not returned by ChromaDB query."); // Or handle as error if needed
    }


    // --- Database: Find User and Record Attendance ---
    let user_record = sqlx::query!(
        r#"SELECT id, name, email FROM "User" WHERE email = $1"#,
        matched_email
    )
    .fetch_optional(&state.db_pool)
    .await;

    let user_info = match user_record {
        Ok(Some(record)) => UserInfo {
            id: record.id,
            name: record.name,
            email: record.email,
        },
        Ok(None) => return Ok(CheckinResponse {
            success: false,
            message: "Face matched, but user not found in database.".to_string(),
            user: None,
            error: Some(format!("User with email {} not found in DB", matched_email)),
        }),
        Err(e) => return create_error_response(&format!("Database error finding user: {}", e)),
    };

    // Check if already attended today
    let today_start = Utc::now().date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();

    let existing_attendance = sqlx::query!(
        r#"SELECT id FROM "Absensi" WHERE "userId" = $1 AND date >= $2"#,
        user_info.id,
        today_start
    )
    .fetch_optional(&state.db_pool)
    .await;

     match existing_attendance {
        Ok(Some(_)) => {
            return Ok(CheckinResponse {
                success: false, // Or true, depending on desired behavior for re-checkin
                message: format!("{} has already checked in today.", user_info.name),
                user: Some(user_info),
                error: Some("Already attended today".to_string()),
            });
        }
        Ok(None) => { /* Continue to insert */ }
        Err(e) => return create_error_response(&format!("Database error checking existing attendance: {}", e)),
    }


    // Insert new attendance record
    let insert_result = sqlx::query!(
        r#"INSERT INTO "Absensi" ("userId", status) VALUES ($1, $2)"#,
        user_info.id,
        "hadir" // Assuming "hadir" means present
    )
    .execute(&state.db_pool)
    .await;

    match insert_result {
        Ok(_) => Ok(CheckinResponse {
            success: true,
            message: format!("Present successful for {}", user_info.name),
            user: Some(user_info),
            error: None,
        }),
        Err(e) => create_error_response(&format!("Database error inserting attendance: {}", e)),
    }
}


#[tauri::command]
async fn get_daily_attendance(
    state: State<'_, AppState>,
) -> Result<Vec<EmployeeAttendance>, String> {
    println!("Fetching daily attendance command called");

    let today_start = Utc::now().date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();
    // Use the start of the *next* day for the upper bound to include the whole current day
    let tomorrow_start = (Utc::now().date_naive() + chrono::Duration::days(1)).and_hms_opt(0, 0, 0).unwrap().and_utc();


    // Query uses LEFT JOIN to include employees even if they have no attendance record today
    let employees_attendance = sqlx::query_as!(
        EmployeeAttendance,
        r#"
        SELECT
            u.id,
            u.name,
            u.email,
            CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END as "attended"
        FROM "User" u
        LEFT JOIN "Absensi" a ON u.id = a."userId" AND a.date >= $1 AND a.date < $2
        WHERE u.role = 'employee'
        ORDER BY u.name
        "#,
        today_start,
        tomorrow_start
    )
    .fetch_all(&state.db_pool)
    .await;

    match employees_attendance {
        Ok(records) => Ok(records),
        Err(e) => create_error_response(&format!("Database error fetching attendance: {}", e)),
    }
}


// --- Main Function ---
#[tokio::main] // Use tokio main for async setup
async fn main() {
     // Load .env file from src-tauri directory
    dotenvy::dotenv().expect("Failed to load .env file in src-tauri");

    // --- Get Environment Variables ---
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in src-tauri/.env for Neon Postgres");
    let chroma_api_key = std::env::var("CHROMA_API_KEY")
        .expect("CHROMA_API_KEY must be set in src-tauri/.env");
     let chroma_api_url = std::env::var("CHROMA_API_URL")
        .unwrap_or_else(|_| "https://api.trychroma.com".to_string()); // Default if not set
    let chroma_collection_name = std::env::var("CHROMA_COLLECTION_NAME")
        .unwrap_or_else(|_| "attendance_faces".to_string()); // Default if not set


    // --- Initialize DB Pool ---
    let db_pool = PgPoolOptions::new()
        .max_connections(5) // Adjust pool size as needed
        .connect(&database_url)
        .await
        .expect("Failed to create Neon Postgres pool.");
     println!("Database pool created successfully.");


    // --- Initialize HTTP Client with Auth Header for Chroma ---
     let mut headers = HeaderMap::new();
     let mut auth_value = HeaderValue::from_str(&format!("Bearer {}", chroma_api_key))
        .expect("Invalid Chroma API Key format");
    auth_value.set_sensitive(true);
    headers.insert(AUTHORIZATION, auth_value);
    // Add content type if needed by ChromaDB API - check their docs
    headers.insert("Content-Type", HeaderValue::from_static("application/json"));


    let http_client = Client::builder()
        .default_headers(headers)
        .build()
        .expect("Failed to build reqwest client");
     println!("HTTP client created successfully.");


    // --- Build Tauri App ---
    tauri::Builder::default()
        .manage(AppState { // Add state here
            db_pool,
            http_client,
            chroma_api_url,
            chroma_collection_name,
        })
        .invoke_handler(tauri::generate_handler![
            register_user,
            checkin_user,
            get_daily_attendance
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}