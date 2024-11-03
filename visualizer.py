import base64
import io
import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import plotly.express as px
import json
import openai
import os
import re

matplotlib.use('Agg')

def convert_ndarray(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_ndarray(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_ndarray(i) for i in obj]
    else:
        return obj

def create_plot(python_code):
    local_scope = {}
    exec(python_code, {}, local_scope)

    if 'plt' in python_code:
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format="png")
        plt.close()
        img_buffer.seek(0)
        img_str = base64.b64encode(img_buffer.read()).decode("utf-8")
        return {"type": "image", "data": f"data:image/png;base64,{img_str}"}

    elif 'px' in python_code:  # Check if it's plotly
        fig = local_scope.get('fig', None)  # Retrieve the figure object if defined
        if fig:
            return {"type": "plotly", "data": convert_ndarray(fig.to_dict()['data']), "layout": convert_ndarray(fig.to_dict()['layout'])}
    
    return {"type": "text", "data": python_code}

def process_response(response_text):
    if "```python" in response_text:
        code = response_text.replace("```python", "").replace("```", "").strip()
        code = code.replace("plt.show()", "").replace("fig.show()", "")
        
        try:
            return create_plot(code)
        except Exception as e:
            return f"Error during execution: {e}"
    else:
        return response_text

valid_visualizers = [
    "Line Plot", "Bar Chart", "Histogram", "Scatter Plot",
    "Box Plot", "Heatmap", "Pie Chart", "Area Chart", 
    "Violin Plot", "Pair Plot", "Timeline Plot", "Word Cloud", "Venn Diagram", "Flow Chart"
]

valid_packages = ['matplotlib', 'plotly', 'pandas', 'numpy', 'scikit-learn', 'seaborn', 'statsmodels']

message = (
    f"You are an assistant that can only do two things. First you must paraphrase the prompt. Nothing more than paraphrasing the exact words being said other than spelling fixes and making it a complete sentence. You may not mention anything about a prompt, request, nothing. Imagine you can only use the words being stated in the prompt, but you must fix spelling mistakes."
    f"Second. You must return Python code that properly generates one of these types of graphs: "
    f"{', '.join(valid_visualizers)} and you can only use these packages for creating the graph {', '.join(valid_packages)}. You must choose the most appropriate visualization to create given the following prompt."
    f"If possible create interactive plotly graphs, but we want a mix of plotly and other types of graphs."
)

openai.api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI()

def get_visualizations_json(data):
    results = []
    prompt = data[0]
    prompt = ' '.join(prompt)
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": message},
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    # Execute and get code from response
    response = completion.choices[0].message.content

    code_text = re.search(r"```python(.*?)```", response, re.DOTALL)

    # Extract summary and code
    if code_text:
        summary = response[:code_text.start()].strip()
        code = code_text.group(0).strip()
    else:
        summary = response
        code = ""

    visualization_result = process_response(code)
    visualization_result["summary"] = summary
    results.append(visualization_result)

    return results