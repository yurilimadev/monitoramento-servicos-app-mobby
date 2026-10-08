import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timedelta, timezone

import requests

from extracao import extrair_todos
from etl import resumir_todos

NOME_ABA_ETL = "etl_protocolos"
RESPONSAVEL_AUTOMACAO = "Automacao ETL"
TZ = timezone(timedelta(hours=-3), name="America/Natal")


def gerar_hash(mensagem):
    return hashlib.sha256(mensagem.encode()).hexdigest()


def montar_linhas(resumos, dia_atualizacao, agrupamento="Automatizado"):
    linhas = []
    for r in resumos:
        codigo = gerar_hash(dia_atualizacao + r["secretaria"] + agrupamento + r["servico"])
        linhas.append({
            "codigo_unico": codigo,
            "dia_da_atualizacao": dia_atualizacao,
            "secretaria": r["secretaria"],
            "nome_agrupamento": agrupamento,
            "serviço": r["servico"],
            "aberto": r["aberto"],
            "em_andamento": r["andamento"],
            "encerrado": r["encerrado"],
            "responsavel": RESPONSAVEL_AUTOMACAO,
            "observacao": r["observacao"],
        })
    return linhas


def enviar(url, linhas, aba):
    payload = {
        "target": aba,
        "data": linhas,
    }
    resp = requests.post(
        url,
        data=json.dumps(payload),
        headers={"Content-Type": "text/plain"},
        timeout=300,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"POST ao Apps Script falhou: HTTP {resp.status_code}")
    return resp.json()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inicio", default="2022-01-01", help="data inicial do histórico (AAAA-MM-DD)")
    parser.add_argument("--fim", default=None, help="data final (AAAA-MM-DD); default: hoje em America/Natal")
    parser.add_argument("--enviar", action="store_true", help="envia ao Apps Script (sem isso, só dry-run)")
    parser.add_argument("--aba", default=NOME_ABA_ETL, help="aba destino no payload")
    parser.add_argument("--out", default=None, help="salva o payload em JSON neste caminho")
    args = parser.parse_args()

    hoje_natal = datetime.now(TZ).date()
    fim = args.fim or hoje_natal.isoformat()
    dia_atualizacao = hoje_natal.strftime("%d/%m/%Y")

    token = os.environ.get("TOKEN_MOBBY")
    url = os.environ.get("APPS_SCRIPT_URL")
    if args.enviar and not url:
        print("ERRO: APPS_SCRIPT_URL nao definida", file=sys.stderr)
        sys.exit(1)
    if not token:
        print("ERRO: TOKEN_MOBBY nao definida", file=sys.stderr)
        sys.exit(1)

    print(f"Periodo: {args.inicio} ate {fim} | dia_da_atualizacao: {dia_atualizacao}")
    dados = extrair_todos(args.inicio, fim, token)
    resumos, relatorios = resumir_todos(dados)

    if not resumos:
        print("Nenhuma linha gerada — nada a fazer.")
        sys.exit(2)

    linhas = montar_linhas(resumos, dia_atualizacao)

    payload_preview = {"target": args.aba, "data": linhas}
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(payload_preview, f, ensure_ascii=False, indent=2)
        print(f"Payload salvo em {args.out}")
    print(json.dumps(payload_preview["data"][:3], ensure_ascii=False, indent=2))
    print(f"Total de linhas: {len(linhas)}")

    if not args.enviar:
        print("DRY-RUN: payload nao enviado.")
        return

    resultado = enviar(url, linhas, args.aba)
    print(json.dumps(resultado, ensure_ascii=False)[:500])
    if not resultado.get("success"):
        print("Apps Script retornou erro", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
