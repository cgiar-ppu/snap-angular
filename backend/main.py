# main.py

from fastapi import FastAPI, File, UploadFile, Form
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import io
import pickle
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime

app = FastAPI()

# Allow CORS (so Angular can call the API from http://localhost:4200, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify ["http://localhost:4200"] 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache
# We'll store references to our DataFrame and embeddings here, keyed by dataset name/ID
DATASETS = {}

# Preload or keep a reference to your default dataset path
DEFAULT_DATASET_ID = "default_dataset"
DEFAULT_DATASET_PATH = os.path.join(
    os.path.dirname(__file__),
    "input",
    "export_data_table_results_20240312_160222CET.xlsx"
)

# A function to load the default dataset from disk
def load_default_dataset():
    if not os.path.exists(DEFAULT_DATASET_PATH):
        raise FileNotFoundError(f"Default dataset not found at {DEFAULT_DATASET_PATH}")
    df = pd.read_excel(DEFAULT_DATASET_PATH)
    return df

# We can lazily load a SentenceTransformer model once
EMBEDDING_MODEL = None
def get_embedding_model():
    global EMBEDDING_MODEL
    if EMBEDDING_MODEL is None:
        EMBEDDING_MODEL = SentenceTransformer('all-MiniLM-L6-v2')
    return EMBEDDING_MODEL

@app.post("/select-default-dataset")
def select_default_dataset():
    """
    Loads the default dataset into memory and returns
    basic info: list of columns, dataset ID, row count, etc.
    """
    try:
        df = load_default_dataset()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    DATASETS[DEFAULT_DATASET_ID] = {
        "df": df,
        "embeddings": None,  # not computed yet
        "text_columns": None
    }

    return {
        "dataset_id": DEFAULT_DATASET_ID,
        "columns": df.columns.tolist(),
        "row_count": len(df)
    }

@app.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Uploads a dataset (Excel file), stores it in memory, 
    returns a new dataset ID, columns, and row count.
    """
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid Excel file.")

    # Generate a unique dataset ID for this uploaded file
    dataset_id = f"uploaded_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    DATASETS[dataset_id] = {
        "df": df,
        "embeddings": None,
        "text_columns": None
    }

    return {
        "dataset_id": dataset_id,
        "columns": df.columns.tolist(),
        "row_count": len(df)
    }

@app.post("/compute-embeddings")
def compute_embeddings(
    dataset_id: str = Form(...),
    text_columns: str = Form(...)
):
    """
    Generates or retrieves embeddings for the given dataset and text columns.
    text_columns is a comma-separated string of column names.
    """
    if dataset_id not in DATASETS:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    columns_list = [col.strip() for col in text_columns.split(",") if col.strip()]
    if not columns_list:
        raise HTTPException(status_code=400, detail="No text columns provided.")

    dataset_entry = DATASETS[dataset_id]
    df = dataset_entry["df"]
    # Filter to ensure columns actually exist
    valid_columns = [c for c in columns_list if c in df.columns]
    if not valid_columns:
        raise HTTPException(status_code=400, detail="No valid columns found in dataset.")

    # If already computed for the same columns, skip recompute
    if dataset_entry["embeddings"] is not None and dataset_entry["text_columns"] == valid_columns:
        return {"detail": "Embeddings already computed for these columns."}

    # Prepare text data
    df_fill = df.fillna("")
    texts = df_fill[valid_columns].astype(str).agg(' '.join, axis=1).tolist()

    # Load or compute embeddings
    model = get_embedding_model()
    embeddings = model.encode(texts, show_progress_bar=False)  # or True

    # Store in our in-memory structure
    DATASETS[dataset_id]["embeddings"] = embeddings
    DATASETS[dataset_id]["text_columns"] = valid_columns

    return {
        "detail": f"Embeddings computed for dataset {dataset_id} using columns {valid_columns}",
        "embedding_shape": [len(embeddings), len(embeddings[0]) if len(embeddings)>0 else 0]
    }

@app.post("/search")
def search(
    dataset_id: str = Form(...),
    query: str = Form(...),
    negative_keywords: str = Form(""),
    include_keywords: str = Form(""),
    threshold: float = Form(0.35)
):
    """
    Perform semantic search:
    - embed query
    - compute cosine similarity with dataset embeddings
    - filter by threshold
    - apply negative and required keyword filters
    - return matched rows as JSON
    """
    if dataset_id not in DATASETS:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    dataset_entry = DATASETS[dataset_id]
    df = dataset_entry["df"].fillna("")
    embeddings = dataset_entry["embeddings"]
    text_columns = dataset_entry["text_columns"]

    if embeddings is None or text_columns is None:
        raise HTTPException(status_code=400, detail="Embeddings have not been computed yet.")

    if not query.strip():
        raise HTTPException(status_code=400, detail="Query is empty.")

    # Prepare negative/required keywords
    neg_words = [w.strip().lower() for w in negative_keywords.split(",") if w.strip()]
    inc_words = [w.strip().lower() for w in include_keywords.split(",") if w.strip()]

    # Create the combined text used for filtering (all selected text columns)
    combined_texts = df[text_columns].astype(str).agg(' '.join, axis=1).tolist()

    # Compute similarity
    model = get_embedding_model()
    query_embedding = model.encode([query])
    similarities = cosine_similarity(query_embedding, embeddings)[0]

    # Threshold filtering
    mask = similarities >= threshold
    if not any(mask):
        return {
            "results": [],
            "count": 0,
            "detail": "No results above threshold."
        }

    # Build a DataFrame of relevant docs
    filtered_df = df.loc[mask].copy()
    relevant_sims = similarities[mask]
    filtered_df["similarity_score"] = relevant_sims

    # Negative keyword filter
    if neg_words:
        def pass_negative_filter(text):
            text_lower = text.lower()
            return all(w not in text_lower for w in neg_words)

        row_mask = filtered_df.apply(
            lambda r: pass_negative_filter(" ".join(str(r[col]) for col in text_columns)),
            axis=1
        )
        filtered_df = filtered_df.loc[row_mask]

    # Required keyword filter
    if inc_words:
        def pass_required_filter(text):
            text_lower = text.lower()
            return all(w in text_lower for w in inc_words)

        row_mask = filtered_df.apply(
            lambda r: pass_required_filter(" ".join(str(r[col]) for col in text_columns)),
            axis=1
        )
        filtered_df = filtered_df.loc[row_mask]

    # Sort by similarity desc
    if not filtered_df.empty:
        filtered_df.sort_values(by="similarity_score", ascending=False, inplace=True)

    results_json = filtered_df.to_dict(orient="records")
    return {
        "results": results_json,
        "count": len(filtered_df),
        "detail": "Search completed."
    }