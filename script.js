// Endereço oficial da API Java
const API_BASE_URL = 'http://localhost:8080/api/chamados';

// Variáveis de estado da Paginação
let paginaAtual = 0;
const tamanhoPagina = 5; // Trazer 5 itens por vez


// 1. CARREGAMENTO INICIAL

// Quando a página terminar de carregar, executa a busca dos chamados
document.addEventListener('DOMContentLoaded', () => {
    carregarChamados(paginaAtual);
});


// 2. FUNÇÃO: BUSCAR CHAMADOS (GET)

async function carregarChamados(pagina) {
    try {
        // Usa a Paginação no Java! (Ordenando pelos mais recentes)
        const url = `${API_BASE_URL}?page=${pagina}&size=${tamanhoPagina}&sort=dataAbertura,desc`;
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error('Falha ao buscar os dados da API.');
        }

        const dadosPaginados = await resposta.json();
        
        renderizarTabela(dadosPaginados.content);
        atualizarControlesPaginacao(dadosPaginados);

    } catch (erro) {
        console.error("Erro na comunicação:", erro);
        document.getElementById('lista-chamados-body').innerHTML = 
            '<tr><td colspan="4" style="color: red; text-align: center;">Erro ao conectar com o servidor Java. Verifique se ele está rodando.</td></tr>';
    }
}

// 3. FUNÇÃO: DESENHAR TABELA

function renderizarTabela(chamados) {
    const tbody = document.getElementById('lista-chamados-body');
    tbody.innerHTML = ''; // Limpa o "Carregando..."

    if (chamados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum chamado aberto.</td></tr>';
        return;
    }

    chamados.forEach(chamado => {
        // Cria uma nova linha (<tr>) na tabela
        const tr = tbody.insertRow();

        // SEGURANÇA CONTRA XSS
        tr.insertCell().textContent = chamado.id;
        tr.insertCell().textContent = chamado.titulo;
        
        // Status com um "bagde" simples usando CSS inline e texto seguro
        const tdStatus = tr.insertCell();
        const cor = chamado.status === 'RESOLVIDO' ? 'green' : (chamado.status === 'EM_ANDAMENTO' ? 'orange' : 'red');
        tdStatus.innerHTML = `<span style="color: ${cor}; font-weight: bold;">${chamado.status}</span>`; // O status vem do nosso Enum no Java, é 100% seguro.
        
        tr.insertCell().textContent = chamado.categoria.replace('_', ' '); // Tira o sublinhado do REDE_INTERNET
    });
}

// 4. FUNÇÃO: ABRIR NOVO CHAMADO (POST)

document.getElementById('form-chamado').addEventListener('submit', async (evento) => {
    // Impede a página de dar F5 (recarregar) automaticamente ao enviar o formulário
    evento.preventDefault(); 

    // Montamos a maleta (DTO) exatamente com os nomes dos campos que o Java espera
    const novoChamadoDTO = {
        titulo: document.getElementById('titulo').value,
        descricao: document.getElementById('descricao').value,
        categoria: document.getElementById('categoria').value,
        prioridade: document.getElementById('prioridade').value
    };

    try {
        const resposta = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novoChamadoDTO) // Transforma o objeto JS em JSON
        });

        if (resposta.status === 201) {
            alert("Chamado aberto com sucesso!");
            document.getElementById('form-chamado').reset(); // Limpa os campos
            paginaAtual = 0; // Volta para a primeira página para ver o chamado novo
            carregarChamados(paginaAtual);
        } else if (resposta.status === 400) {
            const errosValidacao = await resposta.json();
            console.warn("O Java recusou os dados:", errosValidacao);
            alert("Preencha todos os campos corretamente.");
        }
    } catch (erro) {
        console.error("Erro ao enviar POST:", erro);
        alert("Erro fatal ao tentar salvar o chamado.");
    }
});

// 5. CONTROLES DE PAGINAÇÃO

function atualizarControlesPaginacao(dadosPaginados) {
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    const infoPagina = document.getElementById('info-pagina');

    // Atualiza o texto "Página X de Y"
    infoPagina.textContent = `Página ${dadosPaginados.number + 1} de ${dadosPaginados.totalPages === 0 ? 1 : dadosPaginados.totalPages}`;

    // Liga/Desliga os botões lendo os metadados mágicos do Spring Boot
    btnAnterior.disabled = dadosPaginados.first;
    btnProximo.disabled = dadosPaginados.last;
}

// Ouvintes de clique para os botões da paginação
document.getElementById('btn-anterior').addEventListener('click', () => {
    paginaAtual--;
    carregarChamados(paginaAtual);
});

document.getElementById('btn-proximo').addEventListener('click', () => {
    paginaAtual++;
    carregarChamados(paginaAtual);
});