const URL = "https://uqqbqsrldydbuiimzyfk.supabase.co";

const KEY = "sb_publishable_k7qTjmFn6lgEWpxUXgLL3A_M2T8ZlJX";


// SALVAR PRODUTO
async function salvar() {

    const nome = document.getElementById("nome").value;

    if (nome === "") {
        alert("Digite o nome do produto!");
        return;
    }

    const resposta = await fetch(
        URL + "/rest/v1/produtos",
        {
            method: "POST",

            headers: {
                "apikey": KEY,
                "Authorization": "Bearer " + KEY,
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nome: nome
            })
        }
    );

    if (resposta.ok) {

        document.getElementById("mensagem").innerText =
            "Produto salvo!";

        document.getElementById("nome").value = "";

        listarProdutos();

    } else {

        document.getElementById("mensagem").innerText =
            "Erro ao salvar.";

    }
}


// LISTAR PRODUTOS
async function listarProdutos() {

    const resposta = await fetch(
        URL + "/rest/v1/produtos?select=*",
        {
            method: "GET",

            headers: {
                "apikey": KEY,
                "Authorization": "Bearer " + KEY
            }
        }
    );

    const produtos = await resposta.json();

    const lista = document.getElementById("lista");

    lista.innerHTML = "";

    produtos.forEach(produto => {

        const item = document.createElement("li");

        item.innerText =
            produto.id + " - " + produto.nome;

        lista.appendChild(item);

    });
}


// CARREGAR PRODUTOS AO ABRIR A PÁGINA
listarProdutos();
