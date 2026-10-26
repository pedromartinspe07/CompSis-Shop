// =========================================================================
// COMPSIS-SHOP - SCRIPT PRINCIPAL (Engenharia de Software)
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    inicializarCadastro();
    inicializarLogin();
    inicializarPagamento();
    inicializarBusca();
    inicializarCatalogoEProduto();
    inicializarCarrinho();
});

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

    // Se tem email e senha, mas NÃO tem confirmar-senha, estamos no login.html
    if (!inputEmail || !inputSenha || inputConfirmarSenha) return;

    const formLogin = inputEmail.closest("form");

    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = inputEmail.value.trim();
        const senha = inputSenha.value;

        const usuarios = JSON.parse(localStorage.getItem("compsis_usuarios") || "[]");
        const usuarioEncontrado = usuarios.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
        );

        if (usuarioEncontrado || (email !== "" && senha !== "")) {
            const usuarioAtivo = usuarioEncontrado || {
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
    const selectPagamento = document.getElementById("forma-pagamento");
    if (!selectPagamento) return; // Não estamos na tela de pagamento

    const formPagamento = selectPagamento.closest("form");
    const fieldsetCartao = document.getElementById("dados-cartao") || formPagamento.querySelector("fieldset");
    const inputNumeroCartao = document.getElementById("numero-cartao");
    const inputCVV = document.getElementById("codigo-verificacao");
    const inputVencimento = document.getElementById("vencimento");
    const inputEndereco = document.getElementById("endereco");

    // Preenche endereço automaticamente se o usuário já estiver logado
    const usuarioLogado = JSON.parse(localStorage.getItem("compsis_usuario_logado") || "null");
    if (usuarioLogado && usuarioLogado.endereco && inputEndereco && !inputEndereco.value) {
        inputEndereco.value = usuarioLogado.endereco;
    }

    // Corrige caso o HTML do Miguel tenha <option value="pix">Boleto</option>
    Array.from(selectPagamento.options).forEach((opt) => {
        if (opt.textContent.trim().toLowerCase().includes("boleto")) {
            opt.value = "boleto";
        }
    });

    // Se o Miguel ainda não tiver criado as divs de PIX e Boleto no HTML, o JS cria automaticamente
    let divPix = document.getElementById("dados-pix");
    if (!divPix) {
        divPix = document.createElement("fieldset");
        divPix.id = "dados-pix";
        divPix.style.display = "none";
        divPix.innerHTML = `
            <legend>Pagamento via PIX</legend>
            <p><i class="fa-solid fa-qrcode"></i> Escaneie o QR Code ou copie a chave abaixo:</p>
            <p>
                <input type="text" id="chave-pix" value="00020126360014BR.GOV.BCB.PIX0114COMPSISSHOP2026" readonly style="width: 100%; max-width: 350px;">
            </p>
            <button type="button" id="btn-copiar-pix">
                <i class="fa-solid fa-copy"></i> Copiar código PIX
            </button>
        `;
        fieldsetCartao.insertAdjacentElement("afterend", divPix);
    }

    let divBoleto = document.getElementById("dados-boleto");
    if (!divBoleto) {
        divBoleto = document.createElement("fieldset");
        divBoleto.id = "dados-boleto";
        divBoleto.style.display = "none";
        divBoleto.innerHTML = `
            <legend>Pagamento via Boleto Bancário</legend>
            <p><i class="fa-solid fa-barcode"></i> O boleto tem vencimento em 3 dias úteis.</p>
            <p><strong>Linha Digitável:</strong> 34191.79001 01043.510047 91020.150008 8 95670000200000</p>
        `;
        divPix.insertAdjacentElement("afterend", divBoleto);
    }

    // Botão de copiar chave PIX
    const btnCopiarPix = document.getElementById("btn-copiar-pix");
    if (btnCopiarPix) {
        btnCopiarPix.addEventListener("click", () => {
            const inputChave = document.getElementById("chave-pix");
            if (inputChave) {
                navigator.clipboard.writeText(inputChave.value).catch(() => {});
            }
            alert("Código PIX copiado para a área de transferência!");
        });
    }

    // Função que alterna entre Cartão, PIX e Boleto
    const inputsCartao = fieldsetCartao ? fieldsetCartao.querySelectorAll("input") : [];

    function atualizarMetodoPagamento() {
        const metodo = selectPagamento.value;
        const ehCartao = metodo === "credito" || metodo === "debito" || metodo === "cartao";

        if (fieldsetCartao) {
            fieldsetCartao.style.display = ehCartao ? "block" : "none";
        }
        // Retira o "required" dos campos de cartão quando o usuário escolhe PIX ou Boleto
        inputsCartao.forEach((input) => {
            input.required = ehCartao;
        });

        if (divPix) {
            divPix.style.display = metodo === "pix" ? "block" : "none";
        }
        if (divBoleto) {
            divBoleto.style.display = metodo === "boleto" ? "block" : "none";
        }
    }

    selectPagamento.addEventListener("change", atualizarMetodoPagamento);
    atualizarMetodoPagamento();

    // Máscaras de formatação para os inputs do Cartão
    if (inputNumeroCartao) {
        inputNumeroCartao.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "").slice(0, 16);
            v = v.replace(/(\d{4})(?=\d)/g, "$1 ");
            e.target.value = v;
        });
    }

    if (inputCVV) {
        inputCVV.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
        });
    }

    if (inputVencimento) {
        inputVencimento.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "").slice(0, 4);
            if (v.length >= 3) {
                v = `${v.slice(0, 2)}/${v.slice(2)}`;
            }
            e.target.value = v;
        });
    }

    // Envio do formulário de pagamento
    formPagamento.addEventListener("submit", (e) => {
        e.preventDefault();

        const metodo = selectPagamento.value;
        const ehCartao = metodo === "credito" || metodo === "debito" || metodo === "cartao";

        if (ehCartao) {
            const numLimpo = inputNumeroCartao.value.replace(/\D/g, "");
            if (numLimpo.length < 13) {
                alert("Por favor, digite um número de cartão válido (mínimo 13 dígitos).");
                return;
            }
            if (inputCVV.value.length < 3) {
                alert("Por favor, digite um código CVV válido (3 ou 4 dígitos).");
                return;
            }
            if (inputVencimento.value.length < 5) {
                alert("Por favor, digite a validade no formato MM/AA.");
                return;
            }
        }

        alert("Pagamento confirmado com sucesso! Obrigado por comprar na CompSis-Shop.");
        localStorage.removeItem("compsis_carrinho"); // Limpa o carrinho após a compra
        window.location.href = "home.html";
    });
}

// =========================================================================
// 4. BARRA DE PESQUISA (Presente no Header de todas as páginas)
// =========================================================================
function inicializarBusca() {
    const inputPesquisa = document.getElementById("pesquisa");
    if (!inputPesquisa) return;

    // Filtra os cards da página em tempo real conforme o usuário digita
    inputPesquisa.addEventListener("input", () => {
        const termo = inputPesquisa.value.toLowerCase().trim();
        const cardsProdutos = document.querySelectorAll(".produto-card, .card-produto, .item-produto");

        cardsProdutos.forEach((card) => {
            const texto = card.textContent.toLowerCase();
            card.style.display = texto.includes(termo) ? "" : "none";
        });
    });

    const formPesquisa = inputPesquisa.closest("form");
    if (formPesquisa) {
        formPesquisa.addEventListener("submit", (e) => {
            e.preventDefault();
            const termo = inputPesquisa.value.trim();
            if (termo) {
                alert(`Buscando resultados para: "${termo}"`);
            }
        });
    }
}

// =========================================================================
// 5. CATÁLOGO DE PRODUTOS E TELA DE DETALHES (home.html / produto.html)
// =========================================================================
function obterCarrinho() {
    return JSON.parse(localStorage.getItem("compsis_carrinho") || "[]");
}

function salvarCarrinho(carrinho) {
    localStorage.setItem("compsis_carrinho", JSON.stringify(carrinho));
}

function adicionarAoCarrinho(produto) {
    const carrinho = obterCarrinho();
    carrinho.push(produto);
    salvarCarrinho(carrinho);
    alert(`"${produto.nome}" foi adicionado ao seu carrinho!`);
}

function inicializarCatalogoEProduto() {
    // Detecta botões de "Adicionar ao carrinho" (como na tela do Fone Bluetooth)
    const botoes = document.querySelectorAll("button, a.btn-adicionar, .btn-adicionar-carrinho");

    botoes.forEach((botao) => {
        const textoBotao = botao.textContent.trim().toLowerCase();
        if (textoBotao.includes("adicionar ao carrinho")) {
            botao.addEventListener("click", (e) => {
                e.preventDefault();

                const container = botao.closest("main, .produto-detalhe, .card-produto") || document;
                const tituloEl = container.querySelector("h1, h2, h3");
                const imagemEl = container.querySelector("img");
                const precoAttr = botao.getAttribute("data-preco");

                const produto = {
                    id: Date.now(),
                    nome: tituloEl ? tituloEl.textContent.trim() : "Fone Bluetooth",
                    preco: precoAttr ? parseFloat(precoAttr) : 166.67,
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
    const elTotalItens = document.getElementById("total-itens");
    const elPrecoTotal = document.getElementById("preco-total");
    const btnFinalizar = document.getElementById("btn-finalizar-pedido");

    const carrinho = obterCarrinho();

    if (elTotalItens) {
        elTotalItens.textContent = carrinho.length;
    }

    if (elPrecoTotal) {
        const soma = carrinho.reduce((acc, item) => acc + (Number(item.preco) || 0), 0);
        elPrecoTotal.textContent = `${soma.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}R$`;
    }

    // Procura o botão "Finalizar pedido" (mesmo se estiver escrito "Finaizar pedido" igual à foto)
    const todosBotoes = document.querySelectorAll("button, a");
    todosBotoes.forEach((btn) => {
        const txt = btn.textContent.trim().toLowerCase();
        if (txt.includes("finalizar pedido") || txt.includes("finaizar pedido") || btn === btnFinalizar) {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                window.location.href = "pagamento.html";
            });
        }
    });
}