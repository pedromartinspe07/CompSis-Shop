// =========================================================================
// COMPSIS-SHOP - SCRIPT PRINCIPAL (Engenharia de Software)
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    inicializarHeader();
    inicializarCadastro();
    inicializarLogin();
    inicializarPagamento();
    inicializarBusca();
    inicializarCatalogoEProduto();
    inicializarCarrinho();
});

// =========================================================================
// FUNÇÕES UTILITÁRIAS E GERENCIAMENTO DO CARRINHO
// =========================================================================
function formatarMoeda(valor) {
    const numero = Number(valor) || 0;
    return `R$ ${numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function extrairPrecoTexto(texto) {
    if (!texto) return 0;
    const match = texto.match(/R\$\s*([\d.]+,\d{2})/);
    if (match) {
        return parseFloat(match[1].replace(/\./g, "").replace(",", "."));
    }
    const limpo = texto.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(limpo) || 0;
}

function obterCarrinho() {
    const salvo = localStorage.getItem("compsis_carrinho");
    if (salvo !== null) {
        try {
            return JSON.parse(salvo);
        } catch (e) {
            return [];
        }
    }

    // Se ainda não houver carrinho salvo e estivermos na página de carrinho com itens iniciais no HTML,
    // sincroniza os itens estáticos do HTML para o localStorage na primeira visita
    const artigosHtml = document.querySelectorAll("#lista-carrinho .item-carrinho, section[aria-labelledby='itens-carrinho'] article");
    if (artigosHtml.length > 0) {
        const itensIniciais = Array.from(artigosHtml).map((artigo, index) => {
            const tituloEl = artigo.querySelector("h3, h2");
            const nome = tituloEl ? tituloEl.textContent.trim() : `Produto ${index + 1}`;
            const id = artigo.getAttribute("data-id") || nome.toLowerCase().replace(/\s+/g, "-");
            const precoAttr = artigo.getAttribute("data-preco");
            const preco = precoAttr ? parseFloat(precoAttr) : extrairPrecoTexto(artigo.textContent);
            const inputQtd = artigo.querySelector("input[type='number']");
            const quantidade = inputQtd ? Math.max(1, parseInt(inputQtd.value, 10) || 1) : 1;
            const paragrafos = artigo.querySelectorAll("p");
            const icone = paragrafos.length > 0 ? paragrafos[0].textContent.trim() : "📦";

            return { id, nome, preco, quantidade, icone };
        });

        salvarCarrinho(itensIniciais);
        return itensIniciais;
    }

    return [];
}

function salvarCarrinho(carrinho) {
    localStorage.setItem("compsis_carrinho", JSON.stringify(carrinho));
    atualizarBadgeHeader();
}

function calcularTotalUnidades(carrinho) {
    return carrinho.reduce((acc, item) => acc + (Number(item.quantidade) || 1), 0);
}

function calcularValorTotal(carrinho) {
    return carrinho.reduce((acc, item) => {
        const preco = Number(item.preco) || 0;
        const qtd = Number(item.quantidade) || 1;
        return acc + preco * qtd;
    }, 0);
}

function adicionarAoCarrinho(produto) {
    const carrinho = obterCarrinho();
    const itemExistente = carrinho.find(
        (item) =>
            (produto.id && item.id === produto.id) ||
            item.nome.toLowerCase() === produto.nome.toLowerCase()
    );

    if (itemExistente) {
        itemExistente.quantidade = (Number(itemExistente.quantidade) || 1) + (Number(produto.quantidade) || 1);
    } else {
        carrinho.push({
            id: produto.id || produto.nome.toLowerCase().replace(/\s+/g, "-"),
            nome: produto.nome,
            preco: Number(produto.preco) || 0,
            quantidade: Number(produto.quantidade) || 1,
            icone: produto.icone || "📦",
            imagem: produto.imagem || ""
        });
    }

    salvarCarrinho(carrinho);
    alert(`"${produto.nome}" foi adicionado ao seu carrinho!`);
}

// =========================================================================
// 0. HEADER DINÂMICO (Contador do carrinho e Usuário logado)
// =========================================================================
function atualizarBadgeHeader() {
    const linksCarrinho = document.querySelectorAll('header a[href="carrinho.html"]');
    const carrinho = obterCarrinho();
    const totalUnidades = calcularTotalUnidades(carrinho);

    linksCarrinho.forEach((link) => {
        link.textContent = totalUnidades > 0 ? `Meu carrinho (${totalUnidades})` : "Meu carrinho";
    });
}

function inicializarHeader() {
    atualizarBadgeHeader();

    const usuarioLogado = JSON.parse(localStorage.getItem("compsis_usuario_logado") || "null");
    if (!usuarioLogado || !usuarioLogado.nome) return;

    const linksLogin = document.querySelectorAll('header a[href="login.html"]');
    linksLogin.forEach((link) => {
        const primeiroNome = usuarioLogado.nome.split(" ")[0];
        if (link.querySelector("i")) {
            link.innerHTML = `<i class="fa-solid fa-user"></i> Olá, ${primeiroNome} (Sair)`;
        } else {
            link.textContent = `Olá, ${primeiroNome} (Sair)`;
        }
        link.title = "Clique para encerrar a sessão";

        link.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm(`Deseja sair da conta de ${usuarioLogado.nome}?`)) {
                localStorage.removeItem("compsis_usuario_logado");
                window.location.reload();
            }
        });
    });
}

// =========================================================================
// 1. TELA DE CADASTRO (cadastro.html)
// =========================================================================
function inicializarCadastro() {
    const inputConfirmarSenha = document.getElementById("confirmar-senha");
    if (!inputConfirmarSenha) return; // Não estamos na tela de cadastro

    const formCadastro = inputConfirmarSenha.closest("form");
    const inputTelefone = document.getElementById("telefone");

    // Máscara automática para Telefone: (00) 00000-0000
    if (inputTelefone) {
        inputTelefone.addEventListener("input", (e) => {
            let valor = e.target.value.replace(/\D/g, "").slice(0, 11);
            if (valor.length > 6) {
                valor = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
            } else if (valor.length > 2) {
                valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
            }
            e.target.value = valor;
        });
    }

    formCadastro.addEventListener("submit", (e) => {
        e.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const endereco = document.getElementById("endereco").value.trim();
        const telefone = document.getElementById("telefone").value.trim();
        const senha = document.getElementById("senha").value;
        const confirmarSenha = inputConfirmarSenha.value;

        if (senha !== confirmarSenha) {
            alert("Erro: As senhas digitadas não coincidem!");
            return;
        }

        if (senha.length < 4) {
            alert("A senha deve ter pelo menos 4 caracteres.");
            return;
        }

        const usuarios = JSON.parse(localStorage.getItem("compsis_usuarios") || "[]");
        const emailExiste = usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase());

        if (emailExiste) {
            alert("Este e-mail já está cadastrado! Faça login.");
            return;
        }

        usuarios.push({ nome, email, endereco, telefone, senha });
        localStorage.setItem("compsis_usuarios", JSON.stringify(usuarios));

        alert("Cadastro realizado com sucesso! Redirecionando para o login...");
        window.location.href = "login.html";
    });
}

// =========================================================================
// 2. TELA DE LOGIN (login.html)
// =========================================================================
function inicializarLogin() {
    const inputEmail = document.getElementById("email");
    const inputSenha = document.getElementById("senha");
    const inputConfirmarSenha = document.getElementById("confirmar-senha");

    //mudar o nome de "minha conta para o nome no login"
    const nome = localStorage.getItem("usuarioNome");

    const nomeUsuario = document.getElementById("nomeUsuario");
    const usuarioLink = document.getElementById("usuarioLink");


    // Se tem email e senha, mas NÃO tem confirmar-senha, estamos no login.html
    if (!inputEmail || !inputSenha || inputConfirmarSenha) return;

    const formLogin = inputEmail.closest("form");
    const linkEsqueciSenha = document.getElementById("link-esqueci-senha") || formLogin.querySelector('a[href="#"]');

    if (linkEsqueciSenha) {
        linkEsqueciSenha.addEventListener("click", (e) => {
            e.preventDefault();
            const emailDigitado = inputEmail.value.trim() || prompt("Digite seu e-mail cadastrado para recuperar a senha:");
            if (!emailDigitado) return;

            const usuarios = JSON.parse(localStorage.getItem("compsis_usuarios") || "[]");
            const usuario = usuarios.find((u) => u.email.toLowerCase() === emailDigitado.toLowerCase());

            if (usuario) {
                alert(`Instruções de recuperação enviadas para ${emailDigitado}!\n(Lembrete de teste: sua senha é "${usuario.senha}")`);
            } else {
                alert(`Se o e-mail ${emailDigitado} estiver cadastrado, você receberá um link de recuperação em instantes.`);
            }
        });
    }

    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = inputEmail.value.trim();
        const senha = inputSenha.value;

        const usuarios = JSON.parse(localStorage.getItem("compsis_usuarios") || "[]");
        const usuarioPorEmail = usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (usuarioPorEmail && usuarioPorEmail.senha !== senha) {
            alert("Senha incorreta para este e-mail!");
            return;
        }

        if (usuarioPorEmail || (email !== "" && senha !== "")) {
            const usuarioAtivo = usuarioPorEmail || {
                nome: email.split("@")[0],
                email: email,
                endereco: ""
            };
            localStorage.setItem("compsis_usuario_logado", JSON.stringify(usuarioAtivo));
            alert(`Bem-vindo(a), ${usuarioAtivo.nome}!`);
            window.location.href = "home.html";
        } else {
            alert("E-mail ou senha incorretos!");
        }
    });
}

// =========================================================================
// 3. TELA DE PAGAMENTO (pagamento.html)
// =========================================================================
function inicializarPagamento() {
    const selectPagamento =
        document.getElementById("forma-pagamento") ||
        document.querySelector("main select, form select");
    if (!selectPagamento) return; // Não estamos na tela de pagamento

    const formPagamento = selectPagamento.closest("form") || document.querySelector("form");

    // Exibe resumo do valor total na tela de pagamento
    const carrinho = obterCarrinho();
    const totalCompra = calcularValorTotal(carrinho);
    const totalUnidades = calcularTotalUnidades(carrinho);

    if (totalUnidades > 0 && formPagamento && !document.getElementById("resumo-pagamento-valor")) {
        const pResumo = document.createElement("p");
        pResumo.id = "resumo-pagamento-valor";
        pResumo.innerHTML = `<strong>Resumo do pedido:</strong> ${totalUnidades} item(ns) — <strong>Total a pagar: ${formatarMoeda(totalCompra)}</strong>`;
        formPagamento.insertAdjacentElement("beforebegin", pResumo);
    }

    // Preenche endereço automaticamente se o usuário já estiver logado
    const usuarioLogado = JSON.parse(localStorage.getItem("compsis_usuario_logado") || "null");
    const inputEndereco =
        document.getElementById("endereco") ||
        document.querySelector('input[placeholder*="Rua"], input[name*="endereco"]');
    if (usuarioLogado && usuarioLogado.endereco && inputEndereco && !inputEndereco.value) {
        inputEndereco.value = usuarioLogado.endereco;
    }

    // Padroniza os valores do <select> de forma de pagamento pelo texto de cada <option>
    Array.from(selectPagamento.options).forEach((opt, idx) => {
        const txt = opt.textContent.trim().toLowerCase();
        if (txt.includes("selecione") || (idx === 0 && !opt.value)) {
            opt.value = "";
        } else if (txt.includes("crédito") || txt.includes("credito")) {
            opt.value = "credito";
        } else if (txt.includes("débito") || txt.includes("debito")) {
            opt.value = "debito";
        } else if (txt.includes("pix")) {
            opt.value = "pix";
        } else if (txt.includes("boleto")) {
            opt.value = "boleto";
        } else if (txt.includes("cartão") || txt.includes("cartao")) {
            opt.value = "credito";
        }
    });

    // Localiza os containers de cada forma de pagamento no HTML (seja <section>, <fieldset> ou <div>)
    function encontrarSecaoPagamento(idPossivel, palavrasChaveTitulo) {
        for (const id of idPossivel) {
            const el = document.getElementById(id);
            if (el) return el;
        }
        const titulos = document.querySelectorAll("h2, h3, legend");
        for (const titulo of titulos) {
            const texto = titulo.textContent.trim().toLowerCase();
            if (palavrasChaveTitulo.some((p) => texto.includes(p))) {
                const container = titulo.closest("section, fieldset, .metodo-pagamento, .secao-pagamento, div");
                if (container && container !== formPagamento && container.tagName !== "MAIN") {
                    return container;
                }
            }
        }
        return null;
    }

    const secaoCredito = encontrarSecaoPagamento(
        ["secao-credito", "cartao-credito", "dados-credito", "dados-cartao"],
        ["cartão de crédito", "cartao de credito"]
    );
    const secaoDebito = encontrarSecaoPagamento(
        ["secao-debito", "cartao-debito", "dados-debito"],
        ["cartão de débito", "cartao de debito"]
    );
    const secaoPix = encontrarSecaoPagamento(
        ["secao-pix", "pagamento-pix", "dados-pix", "pix"],
        ["pagamento via pix", "via pix"]
    );
    const secaoBoleto = encontrarSecaoPagamento(
        ["secao-boleto", "pagamento-boleto", "dados-boleto", "boleto"],
        ["boleto bancário", "boleto bancario"]
    );

    const mapaSecoes = {
        credito: secaoCredito,
        debito: secaoDebito,
        pix: secaoPix,
        boleto: secaoBoleto
    };

    // Função que mostra apenas a forma de pagamento escolhida e ativa/desativa o "required" dos campos
    function atualizarMetodoPagamento() {
        const metodoEscolhido = selectPagamento.value;

        Object.entries(mapaSecoes).forEach(([chave, secao]) => {
            if (!secao) return;
            const ativo = chave === metodoEscolhido;
            secao.style.display = ativo ? "block" : "none";

            const campos = secao.querySelectorAll("input, select");
            campos.forEach((campo) => {
                campo.required = ativo;
                campo.disabled = !ativo;
            });
        });
    }

    selectPagamento.addEventListener("change", atualizarMetodoPagamento);
    atualizarMetodoPagamento(); // Executa ao abrir a página para esconder todas até o usuário escolher

    // Máscaras automáticas para CEP, CPF, Número do Cartão, Validade e CVV
    const todosInputs = document.querySelectorAll("main input, form input");
    todosInputs.forEach((input) => {
        const info = `${input.id} ${input.name} ${input.placeholder}`.toLowerCase();

        if (info.includes("cep") || info.includes("00000-000")) {
            input.addEventListener("input", (e) => {
                let v = e.target.value.replace(/\D/g, "").slice(0, 8);
                if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5)}`;
                e.target.value = v;
            });
        } else if (info.includes("cpf")) {
            input.addEventListener("input", (e) => {
                let v = e.target.value.replace(/\D/g, "").slice(0, 11);
                if (v.length > 9) v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
                else if (v.length > 6) v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
                else if (v.length > 3) v = `${v.slice(0, 3)}.${v.slice(3)}`;
                e.target.value = v;
            });
        } else if (info.includes("numero") || info.includes("número")) {
            input.addEventListener("input", (e) => {
                let v = e.target.value.replace(/\D/g, "").slice(0, 16);
                v = v.replace(/(\d{4})(?=\d)/g, "$1 ");
                e.target.value = v;
            });
        } else if (info.includes("validade") || info.includes("vencimento") || info.includes("mm/aa")) {
            input.addEventListener("input", (e) => {
                let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                e.target.value = v;
            });
        } else if (info.includes("cvv") || info.includes("seguranca") || info.includes("segurança") || info.includes("verificacao")) {
            input.addEventListener("input", (e) => {
                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
            });
        }
    });

    // Envio do formulário de pagamento
    if (formPagamento) {
        formPagamento.addEventListener("submit", (e) => {
            e.preventDefault();

            const metodo = selectPagamento.value;
            if (!metodo) {
                alert("Por favor, selecione uma forma de pagamento antes de confirmar!");
                selectPagamento.focus();
                return;
            }

            if (metodo === "pix") {
                alert("Pedido confirmado! Chave PIX Copia e Cola gerada:\n00020126360014BR.GOV.BCB.PIX0114COMPSISSHOP2026");
            } else if (metodo === "boleto") {
                alert("Pedido confirmado! Boleto gerado com sucesso.\nLinha Digitável: 34191.79001 01043.510047 91020.150008 8 95670000200000");
            } else {
                alert("Pagamento com cartão aprovado com sucesso! Obrigado por comprar na CompSis-Shop.");
            }

            salvarCarrinho([]); // Limpa o carrinho após a compra
            window.location.href = "home.html";
        });
    }
}

// =========================================================================
// 4. BARRA DE PESQUISA (Presente no Header de todas as páginas)
// =========================================================================
function inicializarBusca() {
    const inputPesquisa = document.getElementById("pesquisa");
    if (!inputPesquisa) return;

    function filtrarCards(termo) {
        const termoLimpo = termo.toLowerCase().trim();
        const cardsProdutos = document.querySelectorAll(
            "#produtos article, .produto-card, .card-produto, .item-produto"
        );

        if (cardsProdutos.length === 0) return false;

        let encontrados = 0;
        cardsProdutos.forEach((card) => {
            const texto = card.textContent.toLowerCase();
            const visivel = texto.includes(termoLimpo);
            card.style.display = visivel ? "" : "none";
            if (visivel) encontrados++;
        });

        let msgVazio = document.getElementById("msg-busca-vazia");
        const secaoProdutos = document.getElementById("produtos");
        if (secaoProdutos) {
            if (encontrados === 0 && termoLimpo !== "") {
                if (!msgVazio) {
                    msgVazio = document.createElement("p");
                    msgVazio.id = "msg-busca-vazia";
                    secaoProdutos.appendChild(msgVazio);
                }
                msgVazio.textContent = `Nenhum produto encontrado para "${termo}".`;
                msgVazio.style.display = "block";
            } else if (msgVazio) {
                msgVazio.style.display = "none";
            }
        }

        return true;
    }

    // Se a URL já vier com ?q=termo (ex: pesquisou a partir da página de pagamento)
    const params = new URLSearchParams(window.location.search);
    const termoUrl = params.get("q");
    if (termoUrl) {
        inputPesquisa.value = termoUrl;
        filtrarCards(termoUrl);
    }

    // Filtra os cards da página em tempo real conforme o usuário digita
    inputPesquisa.addEventListener("input", () => {
        filtrarCards(inputPesquisa.value);
    });

    const formPesquisa = inputPesquisa.closest("form");
    if (formPesquisa) {
        formPesquisa.addEventListener("submit", (e) => {
            const termo = inputPesquisa.value.trim();
            const temCardsNaPagina = filtrarCards(termo);

            if (temCardsNaPagina) {
                e.preventDefault();
                const secaoProdutos = document.getElementById("produtos");
                if (secaoProdutos) {
                    secaoProdutos.scrollIntoView({ behavior: "smooth" });
                }
            } else if (termo) {
                e.preventDefault();
                window.location.href = `home.html?q=${encodeURIComponent(termo)}`;
            }
        });
    }
}

// =========================================================================
// 5. CATÁLOGO DE PRODUTOS E TELA DE DETALHES (home.html / produto.html)
// =========================================================================
function inicializarCatalogoEProduto() {
    const botoes = document.querySelectorAll("button, a.btn-adicionar, .btn-adicionar-carrinho");

    botoes.forEach((botao) => {
        const textoBotao = botao.textContent.trim().toLowerCase();
        if (
            botao.classList.contains("btn-adicionar-carrinho") ||
            botao.classList.contains("btn-adicionar") ||
            textoBotao.includes("adicionar ao carrinho")
        ) {
            botao.addEventListener("click", (e) => {
                e.preventDefault();

                const container = botao.closest("article, .produto-detalhe, .card-produto, main") || document;
                const tituloEl = container.querySelector("h3, h2, h1");
                const imagemEl = container.querySelector("img");
                const iconeEl = container.querySelector(".icone-produto");

                const idAttr = botao.getAttribute("data-id") || container.getAttribute("data-id");
                const nomeAttr = botao.getAttribute("data-nome");
                const precoAttr = botao.getAttribute("data-preco");
                const iconeAttr = botao.getAttribute("data-icone") || container.getAttribute("data-icone");

                const nome = nomeAttr || (tituloEl ? tituloEl.textContent.trim() : "Produto CompSis");
                const preco = precoAttr ? parseFloat(precoAttr) : extrairPrecoTexto(container.textContent);
                const icone = iconeAttr || (iconeEl ? iconeEl.textContent.trim() : "📦");

                const produto = {
                    id: idAttr || nome.toLowerCase().replace(/\s+/g, "-"),
                    nome: nome,
                    preco: preco,
                    quantidade: 1,
                    icone: icone,
                    imagem: imagemEl ? imagemEl.src : ""
                };

                adicionarAoCarrinho(produto);
            });
        }
    });
}

// =========================================================================
// 6. TELA DE CARRINHO (carrinho.html)
// =========================================================================
function inicializarCarrinho() {
    const secaoItens = document.getElementById("secao-itens-carrinho") || document.querySelector('section[aria-labelledby="itens-carrinho"]');
    const elTotalItens = document.getElementById("total-itens");
    const elSubtotalPedido = document.getElementById("subtotal-pedido");
    const elPrecoTotal = document.getElementById("preco-total");
    const btnFinalizar = document.getElementById("btn-finalizar-pedido");

    // Se não estivermos na página de carrinho, não prossegue
    if (!secaoItens && !elTotalItens && !elPrecoTotal) return;

    let listaContainer = document.getElementById("lista-carrinho");
    if (!listaContainer && secaoItens) {
        listaContainer = document.createElement("div");
        listaContainer.id = "lista-carrinho";
        const artigosExistentes = secaoItens.querySelectorAll("article");
        artigosExistentes.forEach((art) => listaContainer.appendChild(art));
        secaoItens.appendChild(listaContainer);
    }

    function renderizarCarrinho() {
        const carrinho = obterCarrinho();
        const totalUnidades = calcularTotalUnidades(carrinho);
        const somaTotal = calcularValorTotal(carrinho);

        if (elTotalItens) {
            elTotalItens.textContent = totalUnidades;
        }

        if (elSubtotalPedido) {
            elSubtotalPedido.textContent = formatarMoeda(somaTotal);
        }

        if (elPrecoTotal) {
            elPrecoTotal.textContent = formatarMoeda(somaTotal);
        }

        if (!listaContainer) return;

        if (carrinho.length === 0) {
            listaContainer.innerHTML = `
                <p>Seu carrinho está vazio no momento.</p>
                <p><a href="home.html#produtos">Voltar para o catálogo de produtos</a></p>
            `;
            return;
        }

        listaContainer.innerHTML = "";

        carrinho.forEach((item, index) => {
            const precoUnitario = Number(item.preco) || 0;
            const quantidade = Math.max(1, Number(item.quantidade) || 1);
            const subtotalItem = precoUnitario * quantidade;
            const inputId = `quantidade-item-${index}`;

            const article = document.createElement("article");
            article.className = "item-carrinho";
            article.setAttribute("data-id", item.id || index);

            article.innerHTML = `
                <h3>${item.nome}</h3>
                <p>${item.icone || "📦"}</p>
                <p>Preço unitário: ${formatarMoeda(precoUnitario)}</p>
                <label for="${inputId}">Quantidade</label>
                <input type="number" id="${inputId}" class="input-quantidade" min="1" value="${quantidade}">
                <p>Subtotal: <span class="subtotal-item">${formatarMoeda(subtotalItem)}</span></p>
                <button type="button" class="btn-remover-item">Remover produto</button>
                <a href="home.html#produtos">Continuar comprando</a>
            `;

            const inputQtd = article.querySelector(".input-quantidade");
            inputQtd.addEventListener("change", (e) => {
                let novaQtd = parseInt(e.target.value, 10);
                if (isNaN(novaQtd) || novaQtd < 1) {
                    novaQtd = 1;
                }
                const carrinhoAtual = obterCarrinho();
                if (carrinhoAtual[index]) {
                    carrinhoAtual[index].quantidade = novaQtd;
                    salvarCarrinho(carrinhoAtual);
                    renderizarCarrinho();
                }
            });

            const btnRemover = article.querySelector(".btn-remover-item");
            btnRemover.addEventListener("click", () => {
                const carrinhoAtual = obterCarrinho();
                carrinhoAtual.splice(index, 1);
                salvarCarrinho(carrinhoAtual);
                renderizarCarrinho();
            });

            listaContainer.appendChild(article);
        });
    }

    renderizarCarrinho();

    // Botão de finalizar compra / pedido
    const todosBotoes = document.querySelectorAll("button, a");
    todosBotoes.forEach((btn) => {
        const txt = btn.textContent.trim().toLowerCase();
        if (
            txt.includes("finalizar pedido") ||
            txt.includes("finaizar pedido") ||
            txt.includes("finalizar compra") ||
            btn === btnFinalizar
        ) {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const carrinhoAtual = obterCarrinho();
                if (carrinhoAtual.length === 0) {
                    alert("Seu carrinho está vazio! Adicione produtos antes de finalizar a compra.");
                    window.location.href = "home.html#produtos";
                    return;
                }
                window.location.href = "pagamento.html";
            });
        }
    });
}
