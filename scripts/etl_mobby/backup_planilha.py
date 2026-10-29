import csv
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

ABAS_OBRIGATORIAS = ["transacoes", "referencia_servicos"]
ABAS_OPCIONAIS = ["etl_protocolos"]


def baixar_aba(spreadsheet_id, api_key, aba):
    range_enc = urllib.parse.quote(aba)
    url = (
        f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}"
        f"/values/{range_enc}?key={api_key}"
    )
    with urllib.request.urlopen(url, timeout=120) as resp:
        return json.load(resp).get("values", [])


def main():
    api_key = (os.environ.get("SHEETS_API_KEY") or "").strip()
    spreadsheet_id = (os.environ.get("SPREADSHEET_ID") or "").strip()
    destino = os.environ.get("BACKUP_DIR", "backup")

    if not api_key or not spreadsheet_id:
        print("ERRO: defina SHEETS_API_KEY e SPREADSHEET_ID", file=sys.stderr)
        sys.exit(1)

    os.makedirs(destino, exist_ok=True)
    resumo = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "spreadsheet_id": spreadsheet_id,
        "abas": {},
    }
    falhas = []

    for aba in ABAS_OBRIGATORIAS + ABAS_OPCIONAIS:
        obrigatoria = aba in ABAS_OBRIGATORIAS
        try:
            values = baixar_aba(spreadsheet_id, api_key, aba)
        except urllib.error.HTTPError as e:
            detalhe = ""
            try:
                detalhe = json.load(e).get("error", {}).get("message", "")
            except Exception:
                pass
            msg = f"{aba}: HTTP {e.code} {detalhe}".strip()
            print(f"ERRO {msg}" if obrigatoria else f"AVISO {msg}", file=sys.stderr)
            if obrigatoria:
                falhas.append(msg)
            resumo["abas"][aba] = {"erro": msg}
            continue
        except Exception as e:
            msg = f"{aba}: {e}"
            print(f"ERRO {msg}" if obrigatoria else f"AVISO {msg}", file=sys.stderr)
            if obrigatoria:
                falhas.append(msg)
            resumo["abas"][aba] = {"erro": msg}
            continue

        caminho = os.path.join(destino, f"{aba}.csv")
        with open(caminho, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerows(values)

        linhas = max(0, len(values) - 1)
        resumo["abas"][aba] = {"linhas": linhas, "arquivo": caminho}
        print(f"{aba}: {linhas} linhas -> {caminho}")

    with open(os.path.join(destino, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(resumo, f, ensure_ascii=False, indent=2)

    if falhas:
        print("Backup incompleto: " + " | ".join(falhas), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
