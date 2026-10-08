import ast
import unicodedata

import pandas as pd

COLUNAS = [
    "id",
    "categoriaServico",
    "subCategoriaServico",
    "statusProtocolo",
    "atendentes",
    "prazo_de_conclusao",
    "data_conclusao",
    "atendidoAs",
]

REGRAS_STATUS = [
    ("aberto", ("aberto",)),
    ("andamento", ("andamento",)),
    ("encerrado", ("encerrad", "conclu", "finaliz", "resolvid")),
]


def normalizar(valor):
    valor = (str(valor) or "")
    valor = unicodedata.normalize("NFD", valor)
    valor = "".join(c for c in valor if not unicodedata.combining(c))
    return valor.lower().strip()


def extrair_campo(valor, chave):
    try:
        return ast.literal_eval(valor).get(chave, "Desconhecido")
    except (ValueError, SyntaxError, AttributeError, TypeError):
        return "Desconhecido"


def mapear_status(status):
    s = normalizar(status)
    for alvo, palavras in REGRAS_STATUS:
        if any(p in s for p in palavras):
            return alvo
    return None


def preparar(df):
    df = df[COLUNAS].copy()
    df["atendentes"] = df["atendentes"].map(lambda v: extrair_campo(v, "name"))
    df["categoriaServico"] = df["categoriaServico"].map(lambda v: extrair_campo(v, "titulo"))
    df["subCategoriaServico"] = df["subCategoriaServico"].map(lambda v: extrair_campo(v, "titulo"))
    df["statusProtocolo"] = df["statusProtocolo"].map(lambda v: extrair_campo(v, "titulo"))
    for col in ("prazo_de_conclusao", "data_conclusao", "atendidoAs"):
        df[col] = pd.to_datetime(df[col], errors="coerce")
    return df


def resumir_secretaria(df, secretaria):
    df = preparar(df)
    df["status_map"] = df["statusProtocolo"].map(mapear_status)

    nao_mapeados = sorted(df.loc[df["status_map"].isna(), "statusProtocolo"].unique())
    df["status_map"] = df["status_map"].fillna("outros")

    contagem = df.groupby(["categoriaServico", "status_map"])["id"].count().unstack(fill_value=0)
    for col in ("aberto", "andamento", "encerrado", "outros"):
        if col not in contagem.columns:
            contagem[col] = 0
    contagem = contagem[["aberto", "andamento", "encerrado", "outros"]]

    df["ano"] = df["atendidoAs"].dt.year
    por_ano = df.groupby(["categoriaServico", "ano"])["id"].count().reset_index()

    linhas = []
    for categoria, qtds_ano in por_ano.groupby("categoriaServico"):
        if categoria not in contagem.index:
            continue
        obs_ano = "; ".join(f"{int(ano)}: {int(qtd)}" for ano, qtd in zip(qtds_ano["ano"], qtds_ano["id"]))
        obs = f"Qtd por ano: {obs_ano}"
        c = contagem.loc[categoria]
        if int(c["outros"]) > 0:
            obs += f" | status nao mapeados: {int(c['outros'])}"
        linhas.append({
            "secretaria": secretaria,
            "servico": categoria,
            "aberto": int(c["aberto"]),
            "andamento": int(c["andamento"]),
            "encerrado": int(c["encerrado"]),
            "observacao": obs,
        })

    relatorio = {
        "linhas": linhas,
        "status_nao_mapeados": nao_mapeados,
        "total_protocolos": int(len(df)),
    }
    return linhas, relatorio


def resumir_todos(dados_por_secretaria):
    linhas = []
    relatorios = {}
    for secretaria, df in dados_por_secretaria.items():
        if df is None or df.empty:
            print(f"{secretaria}: sem dados")
            continue
        linhas_sec, rel = resumir_secretaria(df, secretaria)
        linhas.extend(linhas_sec)
        relatorios[secretaria] = rel
        print(f"{secretaria}: {len(linhas_sec)} categorias | {rel['total_protocolos']} protocolos")
        if rel["status_nao_mapeados"]:
            print(f"  status nao mapeados: {rel['status_nao_mapeados']}")
    return linhas, relatorios
