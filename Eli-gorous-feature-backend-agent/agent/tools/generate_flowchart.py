import json
from langchain.tools import tool

@tool
def generate_flowchart(
    diagram_type: str,
    context: str
) -> dict:
    """
    Generates Mermaid.js diagram code for ER diagrams,
    process flows, and decision trees.
    
    Args:
        diagram_type: "er_diagram", "process_flow", "decision_tree"
        context: The actual, raw, formatted Mermaid.js code syntax ONLY. Do NOT pass english paragraphs or raw JSON.
                 For er_diagram, you MUST write the tables and relationships perfectly:
                 Example: 
                 PATIENTS { string id PK string name }
                 ENCOUNTERS { string id PK string patient_id FK }
                 PATIENTS ||--o{ ENCOUNTERS : "has"
    
    Returns:
        Dict with mermaid_code, diagram_type, and description
    """
    mermaid_code = ""
    description = ""

    # 1. Handle Entity-Relationship (ER) Diagrams
    if diagram_type == "er_diagram":
        # The AI might pass the raw JSON schema, or it might be smart enough 
        # to write the Mermaid syntax itself. We handle both cases gracefully!
        if "erDiagram" in context:
            mermaid_code = context
        else:
            # If the AI passed raw JSON, we can prompt it to format it, but to keep our 
            # hackathon tool robust, we assume the AI is doing its best to pass the structure.
            mermaid_code = f"erDiagram\n{context}"
        
        description = "Entity-Relationship diagram showing database tables and connections."

    # 2. Handle Process Flows and Decision Trees
    elif diagram_type in ["process_flow", "decision_tree"]:
        # The AI will usually generate the 'flowchart TD' syntax directly.
        # We make sure it has the required starting tag if it forgot.
        if "flowchart" in context or "graph" in context:
            mermaid_code = context
        else:
            mermaid_code = f"flowchart TD\n{context}"
            
        description = f"Visual {diagram_type.replace('_', ' ')} based on the requested logic."

    else:
        return {"error": f"Invalid diagram_type: {diagram_type}. Use er_diagram, process_flow, or decision_tree."}

    # 3. Return the strict JSON structure requested by the backend instructions
    return {
        "mermaid_code": mermaid_code,
        "diagram_type": diagram_type,
        "description": description
    }