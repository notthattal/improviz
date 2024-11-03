import os
import numpy as np
import pandas as pd
import hdbscan
from openai import OpenAI


def setup():
    # chunks = ["Linear regression is a statistical method used to model the relationship between a dependent variable and one or more independent variables. By fitting a line through data points, it predicts the dependent variable's values based on known values of the independent variables, minimizing prediction error through least squares.",
    #           "Linear regression is widely used in various fields, such as finance, economics, and machine learning. It helps predict trends, like stock prices or sales, and assess how factors influence outcomes. The simplicity and interpretability of linear regression make it a valuable tool for predictive analysis and forecasting.",
    #           "Linear regression can be simple or multiple. Simple linear regression involves one independent variable predicting one dependent variable. Multiple linear regression, however, includes several independent variables. This approach is more complex but allows for a better understanding of how multiple factors jointly affect an outcome.",
    #           "Linear regression requires certain assumptions: linearity, independence, homoscedasticity (equal variance of residuals), and normality of errors. If assumptions are violated, predictions may become unreliable. Analysts often test these assumptions through statistical diagnostics, as unaddressed issues can compromise the validity of a linear regression model.",
    #           "Linear regression works well for relationships that are linear. However, it struggles with non-linear relationships, multicollinearity, and outliers, which can skew results. Advanced regression methods, such as polynomial regression or regularization techniques like ridge and lasso, help address these limitations and improve predictive accuracy.",
    #           "In the heart of the forest, sunlight filtered through the leaves, creating a mosaic of light and shadow on the ground. A gentle breeze whispered secrets among the trees, while a nearby brook babbled cheerfully. Here, time seemed to stand still, inviting all who wandered to pause and breathe in nature's serenity.",
    #           "Lifelong learning is essential in today’s rapidly changing world. It empowers individuals to adapt to new challenges and seize opportunities for personal and professional growth. Embracing a mindset of curiosity fosters resilience, encouraging exploration beyond traditional education. This continuous journey enriches our understanding and enhances our ability to navigate complex environments.",
    #           "Incorporating diverse learning methods—such as online courses, workshops, and peer collaboration—can deepen knowledge and skills. Engaging with different perspectives broadens horizons, sparking innovation and creativity. By prioritizing lifelong learning, we not only invest in our futures but also contribute to a more informed and adaptable society, ready to tackle the challenges ahead."
    #           ]
    # chunks = ["Linear regression is a statistical method used to model the relationship between a dependent variable and one or more independent variables. By fitting a line through data points, it predicts the dependent variable's values based on known values of the independent variables, minimizing prediction error through least squares.",
    #           "Linear regression is widely used in various fields, such as finance, economics, and machine learning. It helps predict trends, like stock prices or sales, and assess how factors influence outcomes. The simplicity and interpretability of linear regression make it a valuable tool for predictive analysis and forecasting.",
    #           ]

    
    # chunks = ["Linear regression is a statistical method used to model the relationship between a dependent variable and one or more independent variables. By fitting a line through data points, it predicts the dependent variable's values based on known values of the independent variables, minimizing prediction error through least squares.",
    #           ]

    chunks = ["Linear regression is a statistical method used to model the relationship between a dependent variable and one or more independent variables. By fitting a line through data points, it predicts the dependent variable's values based on known values of the independent variables, minimizing prediction error through least squares.",
              "Linear regression is widely used in various fields, such as finance, economics, and machine learning. It helps predict trends, like stock prices or sales, and assess how factors influence outcomes. The simplicity and interpretability of linear regression make it a valuable tool for predictive analysis and forecasting.",
              "In the heart of the forest, sunlight filtered through the leaves, creating a mosaic of light and shadow on the ground. A gentle breeze whispered secrets among the trees, while a nearby brook babbled cheerfully. Here, time seemed to stand still, inviting all who wandered to pause and breathe in nature's serenity.",
              "Lifelong learning is essential in today’s rapidly changing world. It empowers individuals to adapt to new challenges and seize opportunities for personal and professional growth. Embracing a mindset of curiosity fosters resilience, encouraging exploration beyond traditional education. This continuous journey enriches our understanding and enhances our ability to navigate complex environments.",
              "Incorporating diverse learning methods—such as online courses, workshops, and peer collaboration—can deepen knowledge and skills. Engaging with different perspectives broadens horizons, sparking innovation and creativity. By prioritizing lifelong learning, we not only invest in our futures but also contribute to a more informed and adaptable society, ready to tackle the challenges ahead."
              ]
    return chunks

def generate_topic_list(chunks):
    import textrazor
    import ssl
    
    # Bypass SSL certificate verification
    ssl._create_default_https_context = ssl._create_unverified_context
    
    # Open the file in read mode
    with open('text_razor_api.txt', 'r') as file:
        # Read the API key from the file
        textrazor_api_key = file.readline().strip()

    # Use the API key in your code
    print(f"API Key: {textrazor_api_key}")

    textrazor.api_key = textrazor_api_key


    chunk_topic_list = []
    for i in range(len(chunks)):
        client = textrazor.TextRazor(extractors=["entities", "topics"])
        response = client.analyze(chunks[i])

        # for entity in response.entities():
            
        #     print(entity.id, entity.relevance_score, entity.confidence_score, entity.freebase_types)

        print("-----------------New List---------------")

        count = 0
        topics = []
        for topic in response.topics():

            print(topic.label, topic.score)

            topics.append(topic.label)

            count += 1
            if count == 10:
                break
        
        chunk_topic_list.append(topics)

    print(chunk_topic_list)

    return chunk_topic_list

# Function to get embeddings
def get_embedding(text, client, model="text-embedding-3-large"):

    text = text.replace("\n", " ")
    return client.embeddings.create(input=[text], model=model).data[0].embedding


def generate_like_articles(chunks, documents, client):
    # Convert topics to strings
    from sklearn.manifold import TSNE
    import matplotlib.pyplot as plt
    doc_strings = [' '.join(doc) for doc in documents]

    # Get embeddings for each document
    embeddings = [get_embedding(doc, client) for doc in doc_strings]

    # Convert embeddings to numpy array
    embedding_matrix = np.array(embeddings)

    print(embedding_matrix)

    n_samples = embedding_matrix.shape[0]
    perplexity = min(30, n_samples - 1)
    # Apply t-SNE
    tsne = TSNE(n_components=2, random_state=0, perplexity=perplexity, n_iter=1000)
    tsne_results = tsne.fit_transform(embedding_matrix)

    # Create a DataFrame for easier plotting
    df_tsne = pd.DataFrame(tsne_results, columns=['TSNE1', 'TSNE2'])

    # If you have labels, add them to the DataFrame
    # df_tsne['Label'] = labels

    # Plot the results
    plt.figure(figsize=(10, 8))
    plt.scatter(tsne_results[:, 0], tsne_results[:, 1], alpha=0.5)
    plt.title('t-SNE visualization of embeddings')
    plt.xlabel('t-SNE 1')
    plt.ylabel('t-SNE 2')

    plt.show()
        
    # clusterer = hdbscan.HDBSCAN(min_cluster_size=2, metric='euclidean')
    # cluster_labels = clusterer.fit_predict(embedding_matrix)

    # print(cluster_labels)

    # # Perform clustering using HDBSCAN
    # clusterer = hdbscan.HDBSCAN(min_cluster_size=2, metric='euclidean')
    # cluster_labels = clusterer.fit_predict(embedding_matrix)

def generate_like_articles_2(chunks, topic_list):
    from sklearn.cluster import KMeans
    from sentence_transformers import SentenceTransformer
    local_model = SentenceTransformer("./model_folder", trust_remote_code=True, device = "cpu")
    embeddings = local_model.encode(chunks)

    similarities = local_model.similarity(embeddings, embeddings)
    print(similarities.shape)

    kmeans = KMeans(n_clusters=2, random_state=0)
    kmeans.fit(embeddings)
    labels = kmeans.labels_
    centroids = kmeans.cluster_centers_

    df = pd.DataFrame(list(zip(chunks, labels)), columns=['Chunks', 'Labels'])
    result = df.groupby('label')['chunks'].agg(' '.join).reset_index()

    print(result)

    return result







def main():
    chunks = setup()
    # df = pd.read_csv("a.csv")
    topics_list = generate_topic_list(chunks)


    import ssl
    
    # Bypass SSL certificate verification
    ssl._create_default_https_context = ssl._create_unverified_context
    
    # Open the file in read mode
    with open('openai_api.txt', 'r') as file:
        # Read the API key from the file
        openai_api_key = file.readline().strip()

    # Use the API key in your code
    print(f"API Key: {openai_api_key}")

    
    client = OpenAI(api_key=openai_api_key)
    # generate_like_articles(chunks, topics_list, client)
    generate_like_articles_2(chunks, topics_list)


if __name__ == "__main__":
    main()