import os
import smtplib
import ssl
import sys
from email.message import EmailMessage

host = (os.environ.get("SMTP_HOST") or "").strip()
porta = (os.environ.get("SMTP_PORT") or "").strip()
user = (os.environ.get("SMTP_USER") or "").strip()
senha = (os.environ.get("SMTP_PASS") or "").strip()
dest = (os.environ.get("EMAIL_ALERT_TO") or "").strip()

if not all([host, porta, user, senha, dest]):
    print("SMTP nao configurado nos secrets - email nao enviado")
    sys.exit(0)

repo = os.environ.get("REPO", "?")
run_id = os.environ.get("RUN_ID", "")
evento = os.environ.get("EVENTO", "?")

msg = EmailMessage()
msg["Subject"] = f"[ETL Mobby] FALHA - {repo} (evento: {evento})"
msg["From"] = user
msg["To"] = ", ".join(d.strip() for d in dest.split(",") if d.strip())
msg.set_content(
    "O workflow do ETL Mobby falhou.\n\n"
    f"Repositorio: {repo}\n"
    f"Evento: {evento}\n"
    f"Logs: https://github.com/{repo}/actions/runs/{run_id}\n\n"
    "Verifique os logs para o passo que falhou."
)

context = ssl.create_default_context()
try:
    if porta == "465":
        with smtplib.SMTP_SSL(host, int(porta), context=context, timeout=60) as smtp:
            smtp.login(user, senha)
            smtp.send_message(msg)
    else:
        with smtplib.SMTP(host, int(porta), timeout=60) as smtp:
            smtp.starttls(context=context)
            smtp.login(user, senha)
            smtp.send_message(msg)
    print(f"Email de alerta enviado para {msg['To']}")
except Exception as e:
    print(f"Erro ao enviar email de alerta: {e}", file=sys.stderr)
    sys.exit(0)
