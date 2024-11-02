

def setup():
    chunks = ["Linear regression is a statistical method used to model the relationship between a dependent variable and one or more independent variables. By fitting a line through data points, it predicts the dependent variable's values based on known values of the independent variables, minimizing prediction error through least squares.",
              "Linear regression is widely used in various fields, such as finance, economics, and machine learning. It helps predict trends, like stock prices or sales, and assess how factors influence outcomes. The simplicity and interpretability of linear regression make it a valuable tool for predictive analysis and forecasting.",
              "Linear regression can be simple or multiple. Simple linear regression involves one independent variable predicting one dependent variable. Multiple linear regression, however, includes several independent variables. This approach is more complex but allows for a better understanding of how multiple factors jointly affect an outcome.",
              "Linear regression requires certain assumptions: linearity, independence, homoscedasticity (equal variance of residuals), and normality of errors. If assumptions are violated, predictions may become unreliable. Analysts often test these assumptions through statistical diagnostics, as unaddressed issues can compromise the validity of a linear regression model.",
              "Linear regression works well for relationships that are linear. However, it struggles with non-linear relationships, multicollinearity, and outliers, which can skew results. Advanced regression methods, such as polynomial regression or regularization techniques like ridge and lasso, help address these limitations and improve predictive accuracy."
              ]
    return chunks

def generate_visualisations(chunks):
    import textrazor
    import ssl
    
    # Bypass SSL certificate verification
    ssl._create_default_https_context = ssl._create_unverified_context
    
    # Open the file in read mode
    with open('text_razor_api.txt', 'r') as file:
        # Read the API key from the file
        api_key = file.readline().strip()

    # Use the API key in your code
    print(f"API Key: {api_key}")

    textrazor.api_key = api_key

    client = textrazor.TextRazor(extractors=["entities", "topics"])
    response = client.analyze(chunks[0])

    # for entity in response.entities():
        
    #     print(entity.id, entity.relevance_score, entity.confidence_score, entity.freebase_types)

    for topic in response.topics():

        print(topic.label, topic.score)




def main():
    chunks = setup()
    # df = pd.read_csv("a.csv")
    viualisations = generate_visualisations(chunks)


if __name__ == "__main__":
    main()