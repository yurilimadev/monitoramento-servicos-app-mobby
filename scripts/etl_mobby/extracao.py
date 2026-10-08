import time

import pandas as pd
import requests

URL_API = "https://cidades01.api.grt8.com.br:4039/v3/100/protocolos_dashboard/list"

ORGAOS = {
    53: "SEMSUR",
    46: "SEMTAS",
    44: "SEINFRA",
}


def gerar_periodos(inicio, fim):
    from datetime import date, timedelta

    inicio = date.fromisoformat(inicio)
    fim = date.fromisoformat(fim)

    periodos = []
    atual = inicio
    while atual <= fim:
        mes_fim = atual.month + 6
        ano_fim = atual.year
        if mes_fim > 12:
            mes_fim -= 12
            ano_fim += 1
        limite = date(ano_fim, mes_fim, 1)
        fim_periodo = min(limite - timedelta(days=1), fim)
        if fim_periodo >= atual:
            periodos.append((atual.isoformat(), fim_periodo.isoformat()))
        atual = fim_periodo + timedelta(days=1)
    return periodos


def baixar_orgao(orgao_id, secretaria, inicio, fim, token, dormir=1.0, retries=3):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    partes = []
    for i, (data_inicio, data_fim) in enumerate(gerar_periodos(inicio, fim)):
        params = {
            "page": 0,
            "agregador_id": orgao_id,
            "data_inicio": data_inicio,
            "data_fim": data_fim,
            "csvType": "protocolo",
        }
        for tentativa in range(1, retries + 1):
            try:
                resp = requests.get(URL_API, params=params, headers=headers, timeout=120)
                break
            except requests.RequestException as e:
                if tentativa == retries:
                    raise RuntimeError(f"{secretaria} {data_inicio}..{data_fim}: {e}") from e
                time.sleep(dormir * 5 * tentativa)
        if resp.status_code != 200:
            raise RuntimeError(f"{secretaria} {data_inicio}..{data_fim}: HTTP {resp.status_code}")
        registros = resp.json().get("data", [])
        if registros:
            partes.append(pd.DataFrame(registros))
            print(f"  {data_inicio}..{data_fim}: {len(registros)} registros")
        else:
            print(f"  {data_inicio}..{data_fim}: sem registros")
        time.sleep(dormir)

    if not partes:
        return pd.DataFrame()
    df = pd.concat(partes, ignore_index=True)
    df = df.drop_duplicates(subset="id")
    print(f"{secretaria}: {len(df)} registros consolidados")
    return df


def extrair_todos(inicio, fim, token, dormir=1.0):
    dados = {}
    for orgao_id, secretaria in ORGAOS.items():
        print(f"Extraindo {secretaria} (agregador {orgao_id})...")
        dados[secretaria] = baixar_orgao(orgao_id, secretaria, inicio, fim, token, dormir)
    return dados
