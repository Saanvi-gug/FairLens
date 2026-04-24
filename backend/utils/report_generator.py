from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
import io

def generate_fairness_report(audit_data, audit_type="Dataset"):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header
    c.setFont("Helvetica-Bold", 24)
    c.drawString(1 * inch, height - 1 * inch, "FairLens AI Audit Report")
    
    c.setFont("Helvetica", 12)
    c.drawString(1 * inch, height - 1.3 * inch, f"Type: {audit_type} Audit")
    c.line(1 * inch, height - 1.5 * inch, width - 1 * inch, height - 1.5 * inch)

    # Risk Level
    risk = audit_data.get("risk_level", "Unknown")
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1 * inch, height - 2 * inch, "Risk Assessment:")
    
    if risk == "High":
        c.setFillColor(colors.red)
    elif risk == "Medium":
        c.setFillColor(colors.orange)
    else:
        c.setFillColor(colors.green)
    
    c.drawString(2.5 * inch, height - 2 * inch, risk)
    c.setFillColor(colors.black)

    # Metrics Summary
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1 * inch, height - 2.5 * inch, "Key Metrics:")
    
    c.setFont("Helvetica", 10)
    y_pos = height - 2.8 * inch
    
    if audit_type == "Dataset":
        c.drawString(1.2 * inch, y_pos, f"Disparity Score: {audit_data.get('disparity')}")
        y_pos -= 20
    else:
        metrics = audit_data.get("metrics", {})
        for name, val in metrics.items():
            name_pretty = name.replace("_", " ").title()
            c.drawString(1.2 * inch, y_pos, f"{name_pretty}: {val}")
            y_pos -= 20

    # Group Analysis Table Header
    y_pos -= 20
    c.setFont("Helvetica-Bold", 12)
    c.drawString(1 * inch, y_pos, "Group Breakdown:")
    y_pos -= 25
    
    groups = audit_data.get("group_analysis", {})
    c.setFont("Helvetica-Bold", 10)
    c.drawString(1.2 * inch, y_pos, "Group")
    c.drawString(3.2 * inch, y_pos, "Count")
    c.drawString(4.5 * inch, y_pos, "Selection Rate")
    y_pos -= 15
    c.line(1.2 * inch, y_pos + 10, width - 1 * inch, y_pos + 10)

    c.setFont("Helvetica", 10)
    for group, stats in groups.items():
        if y_pos < 1 * inch:
            c.showPage()
            y_pos = height - 1 * inch
            
        c.drawString(1.2 * inch, y_pos, str(group))
        c.drawString(3.2 * inch, y_pos, str(stats.get("count", 0)))
        c.drawString(4.5 * inch, y_pos, str(stats.get("selection_rate", 0)))
        y_pos -= 15

    # Recommendations
    y_pos -= 30
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1 * inch, y_pos, "Recommendations:")
    y_pos -= 25
    
    c.setFont("Helvetica", 10)
    recs = audit_data.get("recommendations", [])
    for rec in recs:
        if y_pos < 1 * inch:
            c.showPage()
            y_pos = height - 1 * inch
            
        c.drawString(1.2 * inch, y_pos, f"• {rec}")
        y_pos -= 20

    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer
