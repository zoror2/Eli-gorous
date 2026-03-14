import json
import os
import pandas as pd
from langchain.tools import tool
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate

@tool
def explain_data(data: dict, question: str) -> dict:
    """
    Generates natural language insights and explanations
    from query results.
    
    Args:
        data: Query result dict from execute_query
        question: The original user question
    
    Returns:
        Dict with summary, key_findings, anomalies, and recommendations
    """
    try:
        # 1. Connect to the local Ollama model, forcing it to return JSON
        llm = ChatOllama(
            model=os.getenv("OLLAMA_MODEL", "llama3.1:8b"),
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            temperature=0.2, # Keep it mostly factual, less creative
            format="json"    # Crucial: forces Ollama to output valid JSON
        )

        # 2. Convert data to a string (limit to 50 rows to prevent overwhelming the AI's memory)
        df = pd.DataFrame(data.get("rows", []), columns=data.get("columns", []))
        data_str = df.head(50).to_json(orient="records")

        # 3. Write a strict prompt for the AI to follow your teammate's rules
        prompt = PromptTemplate.from_template(
            """You are a medical data analyst. Analyze this data to answer the user's question.
            User Question: {question}
            
            Data sample (up to 50 rows):
            {data_str}
            
            You MUST return a valid JSON object with EXACTLY these four keys:
            - "summary": A brief summary in 3 sentences or less.
            - "key_findings": A list of 2-3 important insights.
            - "anomalies": A list of any unusual patterns (values >2 std deviations) or empty list if none.
            - "recommendations": A list of 2-3 suggested follow-up questions for the user.
            
            Return ONLY the JSON object.
            """
        )

        # 4. Send the prompt to Ollama and get the response
        chain = prompt | llm
        response = chain.invoke({"question": question, "data_str": data_str})
        
        # 5. Parse the JSON string into a Python dictionary
        result_dict = json.loads(response.content)
        
        # Ensure we return the exact dictionary structure the backend expects
        return {
            "summary": result_dict.get("summary", "Data analyzed successfully."),
            "key_findings": result_dict.get("key_findings", []),
            "anomalies": result_dict.get("anomalies", []),
            "recommendations": result_dict.get("recommendations", ["What else would you like to know?"])
        }

    except Exception as e:
        # Fallback in case the LLM hallucinates bad JSON or fails
        return {
            "summary": "Data was retrieved, but I encountered an error generating the summary.",
            "key_findings": [f"System Error: {str(e)}"],
            "anomalies": [],
            "recommendations": ["Try asking a simpler question."]
        }