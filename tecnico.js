const API_BASE_URL = 'http://localhost:8080/api/chamados';
let paginaAtual = 0;
const tamanhoPagina = 10;

document.addEventListener('DOMContentLoaded', () => {
    carregarFilaTI(paginaAtual);
});


// 1. CARREGAR FILA DE CHAMADOS

async function carregarFilaTI(pagina) {
    try {
        const url = `${API_BASE_URL}?page=${pagina}&size=${tamanhoPagina}&sort=dataAbertura,desc`;
        const resposta = await fetch(url);

        if (!resposta.ok) throw new Error('Falha ao buscar os dados da API.');

        const dadosPaginados = await resposta.json();
        renderizarTabelaTI(dadosPaginados.content);
        atualizarControlesPaginacao(dadosPaginados);

    } catch (erro) {
        console.error("Erro:", erro);
        document.getElementById('lista-chamados-body').innerHTML = 
            '<tr><td colspan="5" style="color: red; text-align: center;">Erro ao conectar com o servidor.</td></tr>';
    }
}


// 2. RENDERIZAR TABELA COM LÓGICA DE ESTADOS

function renderizarTabelaTI(chamados) {
    const tbody = document.getElementById('lista-chamados-body');
    tbody.innerHTML = ''; 

    if (chamados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Fila limpa! Nenhum chamado no momento.</td></tr>';
        return;
    }

    chamados.forEach(chamado => {
        const tr = tbody.insertRow();

        tr.insertCell().textContent = chamado.id;
        tr.insertCell().textContent = chamado.titulo;
        
        const tdStatus = tr.insertCell();
        const cor = chamado.status === 'RESOLVIDO' ? 'green' : (chamado.status === 'EM_ANDAMENTO' ? 'orange' : 'red');
        tdStatus.innerHTML = `<span style="color: ${cor}; font-weight: bold;">${chamado.status}</span>`; 
        
        tr.insertCell().textContent = chamado.categoria.replace('_', ' ');

        // Coluna de Ações da TI
        const tdAcoes = tr.insertCell();
        tdAcoes.style.display = 'flex';
        tdAcoes.style.gap = '10px';

        if (chamado.status === 'ABERTO') {
            // Botão Assumir (Aparece apenas quando está Aberto)
            const btnAssumir = document.createElement('button');
            btnAssumir.textContent = 'Assumir';
            btnAssumir.style.backgroundColor = '#ffc107'; // Amarelo
            btnAssumir.style.color = '#333';
            btnAssumir.style.padding = '0.4rem 0.8rem';
            
            btnAssumir.addEventListener('click', () => assumirChamado(chamado.id));
            tdAcoes.appendChild(btnAssumir);

        } else if (chamado.status === 'EM_ANDAMENTO') {
            // Botão Resolver (Aparece apenas quando está em Andamento)
            const btnResolver = document.createElement('button');
            btnResolver.textContent = 'Resolver';
            btnResolver.style.backgroundColor = '#28a745'; // Verde
            btnResolver.style.padding = '0.4rem 0.8rem';
            
            btnResolver.addEventListener('click', () => resolverChamado(chamado.id));
            tdAcoes.appendChild(btnResolver);

        } else {
            // Já resolvido
            tdAcoes.textContent = '✔ Finalizado';
            tdAcoes.style.color = 'green';
        }
    });
}


// 3. AÇÕES: ASSUMIR E RESOLVER

async function assumirChamado(id) {
    if (!confirm(`Deseja assumir o atendimento do chamado #${id}?`)) return;

    try {
        const resposta = await fetch(`${API_BASE_URL}/${id}/atender`, { method: 'PUT' });
        if (resposta.ok) {
            carregarFilaTI(paginaAtual); // Atualiza a tela
        } else {
            alert('Falha ao assumir. Verifique se o chamado ainda está ABERTO.');
        }
    } catch (erro) {
        alert('Erro de conexão.');
    }
}

async function resolverChamado(id) {
    if (!confirm(`Deseja marcar o chamado #${id} como resolvido?`)) return;

    try {
        const resposta = await fetch(`${API_BASE_URL}/${id}/resolver`, { method: 'PUT' });
        if (resposta.ok) {
            carregarFilaTI(paginaAtual); // Atualiza a tela
        } else {
            alert('Falha ao resolver o chamado.');
        }
    } catch (erro) {
        alert('Erro de conexão.');
    }
}


// 4. CONTROLES DE PAGINAÇÃO

function atualizarControlesPaginacao(dadosPaginados) {
    document.getElementById('info-pagina').textContent = `Página ${dadosPaginados.number + 1} de ${dadosPaginados.totalPages === 0 ? 1 : dadosPaginados.totalPages}`;
    document.getElementById('btn-anterior').disabled = dadosPaginados.first;
    document.getElementById('btn-proximo').disabled = dadosPaginados.last;
}

document.getElementById('btn-anterior').addEventListener('click', () => {
    paginaAtual--;
    carregarFilaTI(paginaAtual);
});

document.getElementById('btn-proximo').addEventListener('click', () => {
    paginaAtual++;
    carregarFilaTI(paginaAtual);
});