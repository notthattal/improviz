import os
import json
import numpy as np
import pandas as pd
import hdbscan
from openai import OpenAI
from sentence_transformers import SentenceTransformer
import ssl
import visualizer
from flask import Flask, request, jsonify, Response
import textrazor
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


# Code meant for future use to get topics
# def generate_topic_list(chunks):
#     # Bypass SSL certificate verification
#     ssl._create_default_https_context = ssl._create_unverified_context
#     textrazor_api_key = os.getenv("TEXT_RAZOR_API_KEY")
#     textrazor.api_key = textrazor_api_key


#     chunk_topic_list = []
#     for i in range(len(chunks)):
#         client = textrazor.TextRazor(extractors=["entities", "topics"])
#         response = client.analyze(chunks[i])

#         count = 0
#         topics = []
#         for topic in response.topics():
#             topics.append(topic.label)

#             count += 1
#             if count == 10:
#                 break
        
#         chunk_topic_list.append(topics)

#     return chunk_topic_list



def generate_like_articles_2(chunks):
    from sklearn.cluster import KMeans
    local_model = SentenceTransformer("./model_folder", trust_remote_code=True, device="cpu", config_kwargs={"use_memory_efficient_attention": False, "unpad_inputs": False})
    embeddings = local_model.encode(chunks)

    similarities = local_model.similarity(embeddings, embeddings)

    kmeans = KMeans(n_clusters=2, random_state=0)
    kmeans.fit(embeddings)
    labels = kmeans.labels_
    centroids = kmeans.cluster_centers_

    df = pd.DataFrame(list(zip(chunks, labels)), columns=['Chunks', 'Labels'])
    result = df.groupby('Labels')['Chunks'].agg(' '.join).reset_index()

    results = visualizer.get_visualizations_json(result['Chunks'].to_list())
    return results

@app.route('/execute', methods=['POST'])
def execute():
    data = request.get_json()  # Receive JSON input
    if not isinstance(data, list):
        return jsonify({"error": "Invalid input format. Expecting a list."}), 400
    
    # topics_list = generate_topic_list(data)
    
    # Bypass SSL certificate verification
    ssl._create_default_https_context = ssl._create_unverified_context

    results = generate_like_articles_2(data)

    return Response(
        json.dumps(results, ensure_ascii=False),
        content_type="application/json"
    )

if __name__ == '__main__':
    app.run()