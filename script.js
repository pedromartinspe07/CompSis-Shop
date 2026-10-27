// =========================================================================
// COMPSIS-SHOP - SCRIPT PRINCIPAL (Engenharia de Software)
// =========================================================================

// Catálogo base para sincronizar cards da Home e a futura página produto.html
const CATALOGO_PRODUTOS = {
    "processador-i5": {
        id: "processador-i5",
        nome: "Processador Intel Core i5",
        preco: 1099.90,
        icone: "⚙️",
        imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsTVmaBnVTrwSM6z6ZM8UqoVr4aeMNsDDr9kf2n1D-zQ&s=10",
        descricao: "Desempenho para trabalho, estudos e entretenimento.",
        especificacoes: [
            "6 Núcleos e 12 Threads de alto desempenho",
            "Frequência Turbo de até 4.40 GHz",
            "Cache inteligente de 18 MB",
            "Compatível com memória DDR4 e PCIe 4.0"
        ]
    },
    "placa-rtx": {
        id: "placa-rtx",
        nome: "Placa de vídeo GeForce RTX",
        preco: 2499.90,
        icone: "🎮",
        imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQjSEqtoRLi7oUF1Na-LVUqs9Z88lOWHlN7zGTyYpdQQ&s",
        descricao: "Gráficos de alta qualidade para jogos e criação.",
        especificacoes: [
            "Memória dedicada de 8 GB GDDR6",
            "Suporte a Ray Tracing em tempo real e DLSS",
            "Saídas HDMI 2.1 e DisplayPort 1.4a",
            "Sistema de refrigeração Dual Fan silencioso"
        ]
    },
    "memoria-ram-16gb": {
        id: "memoria-ram-16gb",
        nome: "Memória RAM 16 GB DDR4",
        preco: 249.90,
        icone: "💾",
        imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYZmEplLF4LMtMYR_DOlhD0-T5VMVsFZmGvhl9cG4DxA&s",
        descricao: "Mais velocidade para suas tarefas do dia a dia.",
        especificacoes: [
            "Capacidade de 16 GB DDR4 (3200 MHz)",
            "Dissipador de calor em alumínio anodizado",
            "Suporte a perfis Intel XMP 2.0",
            "Baixa latência CL16 para multitarefas e jogos"
        ]
    },
    "ssd-1tb": {
        id: "ssd-1tb",
        nome: "SSD 1 TB",
        preco: 399.90,
        icone: "📀",
        imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjc1my1vNG4EZ1IdK2KutlzUuuk5qapJmZn0Y8whVflQ&s",
        descricao: "Armazenamento rápido para seus arquivos e programas.",
        especificacoes: [
            "Capacidade de 1 TB NVMe M.2 / SATA",
            "Leitura rápida para inicialização instantânea do sistema",
            "Alta durabilidade e resistência a impactos",
            "Ideal para jogos pesados e edição de vídeo"
        ]
    }
};

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
// FUNÇÕES UTILITÁRIAS, CARRINHO E FRETE
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

    // Sincroniza itens estáticos na primeira visita à tela de carrinho
    const artigosHtml = document.querySelectorAll("#lista-carrinho .item-carrinho, section[aria-labelledby='itens-carrinho'] article");
    if (artigosHtml.length > 0) {
        const itensIniciais = Array.from(artigosHtml).map((artigo, index) => {
            const tituloEl = artigo.querySelector("h3, h2");
            const nome = tituloEl ? tituloEl.textContent.trim() : `Produto ${index + 1}`;
            const id = artigo.getAttribute("data-id") || nome.toLowerCase().replace(/\s+/g, "-");
            const dadosCatalogo = CATALOGO_PRODUTOS[id] || {};
            const precoAttr = artigo.getAttribute("data-preco");
            const preco = precoAttr ? parseFloat(precoAttr) : (dadosCatalogo.preco || extrairPrecoTexto(artigo.textContent));
            const inputQtd = artigo.querySelector("input[type='number']");
            const quantidade = inputQtd ? Math.max(1, parseInt(inputQtd.value, 10) || 1) : 1;
            const paragrafos = artigo.querySelectorAll("p");
            const icone = dadosCatalogo.icone || (paragrafos.length > 0 ? paragrafos[0].textContent.trim() : "📦");
            const imagem = dadosCatalogo.imagem || "";

            return { id, nome, preco, quantidade, icone, imagem };
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

function obterFreteSelecionado() {
    try {
        return JSON.parse(localStorage.getItem("compsis_frete") || "null");
    } catch (e) {
        return null;
    }
}

function salvarFreteSelecionado(frete) {
    if (frete) {
        localStorage.setItem("compsis_frete", JSON.stringify(frete));
    } else {
        localStorage.removeItem("compsis_frete");
    }
}

function calcularOpcoesTransportadoras(cepLimpo) {
    // Calcula valores baseados na região do CEP (1º dígito do CEP no Brasil)
    const regiao = parseInt(cepLimpo.charAt(0), 10) || 0;
    const adicionalRegiao = (regiao % 4) * 3.5;

    return [
        {
            id: "pac",
            transportadora: "Correios PAC",
            prazo: "6 a 8 dias úteis",
            preco: Number((18.90 + adicionalRegiao).toFixed(2))
        },
        {
            id: "sedex",
            transportadora: "Correios SEDEX",
            prazo: "2 a 4 dias úteis",
            preco: Number((32.90 + adicionalRegiao).toFixed(2))
        },
        {
            id: "azul",
            transportadora: "Azul Cargo Express",
            prazo: "1 a 2 dias úteis",
            preco: Number((44.90 + adicionalRegiao).toFixed(2))
        }
    ];
}

async function buscarLocalidadeCep(cepLimpo) {
    try {
        const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        if (!resp.ok) return null;
        const dados = await resp.json();
        if (dados.erro) return null;
        return dados;
    } catch (e) {
        return null;
    }
}

function montarWidgetFrete(container, aoSelecionarFrete) {
    if (!container) return;

    const inputCep = container.querySelector('input[id*="cep"], input');
    const btnCalcular = container.querySelector("button");
    let divOpcoes = container.querySelector("#opcoes-frete, .opcoes-frete");

    if (!divOpcoes) {
        divOpcoes = document.createElement("div");
        divOpcoes.className = "opcoes-frete";
        container.appendChild(divOpcoes);
    }

    if (!inputCep || !btnCalcular) return;

    // Máscara de CEP 00000-000
    inputCep.addEventListener("input", (e) => {
        let v = e.target.value.replace(/\D/g, "").slice(0, 8);
        if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5)}`;
        e.target.value = v;
    });

    const freteSalvo = obterFreteSelecionado();
    if (freteSalvo && freteSalvo.cep) {
        inputCep.value = freteSalvo.cep;
        renderizarOpcoesFrete(freteSalvo.cep.replace(/\D/g, ""), freteSalvo.localidade || "");
    }

    async function renderizarOpcoesFrete(cepLimpo, localidadeTexto) {
        const opcoes = calcularOpcoesTransportadoras(cepLimpo);
        const freteAtual = obterFreteSelecionado();
        const idSelecionado = (freteAtual && freteAtual.id) ? freteAtual.id : opcoes[0].id;

        const cabecalhoLocal = localidadeTexto
            ? `<p class="localidade-frete"><i class="fa-solid fa-location-dot"></i> Entrega para: <strong>${localidadeTexto}</strong></p>`
            : `<p class="localidade-frete"><i class="fa-solid fa-truck-fast"></i> Opções para o CEP <strong>${inputCep.value}</strong>:</p>`;

        divOpcoes.innerHTML = `
            ${cabecalhoLocal}
            <div class="lista-transportadoras">
                ${opcoes
                    .map(
                        (op) => `
                    <label class="opcao-transportadora">
                        <input type="radio" name="transportadora_frete" value="${op.id}" ${op.id === idSelecionado ? "checked" : ""}>
                        <span class="info-transportadora">
                            <strong>${op.transportadora}</strong> (${op.prazo})
                        </span>
                        <strong class="preco-transportadora">${formatarMoeda(op.preco)}</strong>
                    </label>
                `
                    )
                    .join("")}
            </div>
        `;

        const opcaoInicial = opcoes.find((o) => o.id === idSelecionado) || opcoes[0];
        const dadosFrete = {
            ...opcaoInicial,
            cep: `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`,
            localidade: localidadeTexto
        };
        salvarFreteSelecionado(dadosFrete);
        if (aoSelecionarFrete) aoSelecionarFrete(dadosFrete);

        const radios = divOpcoes.querySelectorAll('input[name="transportadora_frete"]');
        radios.forEach((radio) => {
            radio.addEventListener("change", () => {
                const escolhida = opcoes.find((o) => o.id === radio.value);
                if (escolhida) {
                    const novoFrete = {
                        ...escolhida,
                        cep: `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`,
                        localidade: localidadeTexto
                    };
                    salvarFreteSelecionado(novoFrete);
                    if (aoSelecionarFrete) aoSelecionarFrete(novoFrete);
                }
            });
        });
    }

    async function acionarCalculo() {
        const cepLimpo = inputCep.value.replace(/\D/g, "");
        if (cepLimpo.length !== 8) {
            alert("Por favor, digite um CEP válido com 8 dígitos (ex: 01001-000).");
            inputCep.focus();
            return;
        }

        divOpcoes.innerHTML = `<p class="calculando-frete">Consultando transportadoras...</p>`;
        const dadosViaCep = await buscarLocalidadeCep(cepLimpo);
        let localidade = "";
        if (dadosViaCep && dadosViaCep.localidade) {
            localidade = `${dadosViaCep.localidade} - ${dadosViaCep.uf}`;
            if (dadosViaCep.logradouro) {
                localStorage.setItem(
                    "compsis_endereco_cep",
                    JSON.stringify({
                        cep: `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`,
                        endereco: `${dadosViaCep.logradouro}, ${dadosViaCep.bairro || ""}`.replace(/,\s*$/, ""),
                        cidade: `${dadosViaCep.localidade} - ${dadosViaCep.uf}`
                    })
                );
            }
        }
        renderizarOpcoesFrete(cepLimpo, localidade);
    }

    btnCalcular.addEventListener("click", acionarCalculo);
    inputCep.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            acionarCalculo();
        }
    });
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
        if (produto.imagem && !itemExistente.imagem) {
            itemExistente.imagem = produto.imagem;
        }
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
    const nomeFallback = localStorage.getItem("usuarioNome");
    const nomeAtivo = (usuarioLogado && usuarioLogado.nome) ? usuarioLogado.nome : nomeFallback;

    if (!nomeAtivo) return;

    const linksLogin = document.querySelectorAll('header a[href="login.html"], #usuarioLink');
    linksLogin.forEach((link) => {
        const primeiroNome = nomeAtivo.split(" ")[0];
        if (link.querySelector("i")) {
            link.innerHTML = `<i class="fa-solid fa-user"></i> Olá, ${primeiroNome} (Sair)`;
        } else {
            link.textContent = `Olá, ${primeiroNome} (Sair)`;
        }
        link.title = "Clique para encerrar a sessão";

        link.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm(`Deseja sair da conta de ${nomeAtivo}?`)) {
                localStorage.removeItem("compsis_usuario_logado");
                localStorage.removeItem("usuarioNome");
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
    if (!inputConfirmarSenha) return;

    const formCadastro = inputConfirmarSenha.closest("form");
    const inputTelefone = document.getElementById("telefone");

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
            localStorage.setItem("usuarioNome", usuarioAtivo.nome);
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
    if (!selectPagamento) return;

    const formPagamento = selectPagamento.closest("form") || document.querySelector("form");

    const carrinho = obterCarrinho();
    const subtotalCompra = calcularValorTotal(carrinho);
    const totalUnidades = calcularTotalUnidades(carrinho);
    const freteEscolhido = obterFreteSelecionado();
    const valorFrete = freteEscolhido ? Number(freteEscolhido.preco) || 0 : 0;
    const totalComFrete = subtotalCompra + valorFrete;

    if (totalUnidades > 0 && formPagamento && !document.getElementById("resumo-pagamento-valor")) {
        const pResumo = document.createElement("p");
        pResumo.id = "resumo-pagamento-valor";
        const textoFrete = freteEscolhido
            ? ` + Frete (${freteEscolhido.transportadora}: ${formatarMoeda(valorFrete)})`
            : "";
        pResumo.innerHTML = `<strong>Resumo do pedido:</strong> ${totalUnidades} item(ns) (${formatarMoeda(subtotalCompra)})${textoFrete} — <strong>Total a pagar: ${formatarMoeda(totalComFrete)}</strong>`;
        formPagamento.insertAdjacentElement("beforebegin", pResumo);
    }

    // Preenche endereço e CEP automaticamente se o usuário já estiver logado ou tiver calculado o CEP no carrinho
    const usuarioLogado = JSON.parse(localStorage.getItem("compsis_usuario_logado") || "null");
    const enderecoCep = JSON.parse(localStorage.getItem("compsis_endereco_cep") || "null");
    const inputEndereco = document.getElementById("endereco") || document.querySelector('input[name*="endereco"]');
    const inputCidade = document.getElementById("cidade") || document.querySelector('input[name*="cidade"]');
    const inputCepPagamento = document.getElementById("cep") || document.querySelector('input[name*="cep"]');

    if (inputEndereco && !inputEndereco.value) {
        if (usuarioLogado && usuarioLogado.endereco) {
            inputEndereco.value = usuarioLogado.endereco;
        } else if (enderecoCep && enderecoCep.endereco) {
            inputEndereco.value = enderecoCep.endereco;
        }
    }
    if (inputCidade && !inputCidade.value && enderecoCep && enderecoCep.cidade) {
        inputCidade.value = enderecoCep.cidade;
    }
    if (inputCepPagamento && !inputCepPagamento.value) {
        if (freteEscolhido && freteEscolhido.cep) {
            inputCepPagamento.value = freteEscolhido.cep;
        } else if (enderecoCep && enderecoCep.cep) {
            inputCepPagamento.value = enderecoCep.cep;
        }
    }

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
    atualizarMetodoPagamento();

    const todosInputs = document.querySelectorAll("main input, form input");
    todosInputs.forEach((input) => {
        const info = `${input.id} ${input.name} ${input.placeholder}`.toLowerCase();

        if (info.includes("cep") || info.includes("00000-000")) {
            input.addEventListener("input", async (e) => {
                let v = e.target.value.replace(/\D/g, "").slice(0, 8);
                if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5)}`;
                e.target.value = v;

                if (v.replace(/\D/g, "").length === 8) {
                    const dadosCep = await buscarLocalidadeCep(v.replace(/\D/g, ""));
                    if (dadosCep) {
                        if (inputCidade && !inputCidade.value && dadosCep.localidade) {
                            inputCidade.value = `${dadosCep.localidade} - ${dadosCep.uf}`;
                        }
                        if (inputEndereco && !inputEndereco.value && dadosCep.logradouro) {
                            inputEndereco.value = `${dadosCep.logradouro}, ${dadosCep.bairro || ""}`.replace(/,\s*$/, "");
                        }
                    }
                }
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

            salvarCarrinho([]);
            salvarFreteSelecionado(null);
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

    const params = new URLSearchParams(window.location.search);
    const termoUrl = params.get("q");
    if (termoUrl) {
        inputPesquisa.value = termoUrl;
        filtrarCards(termoUrl);
    }

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
function extrairDadosDoCard(container, botao) {
    const tituloEl = container.querySelector("h3, h2, h1");
    const imagemEl = container.querySelector("img");
    const iconeEl = container.querySelector(".icone-produto");

    const idAttr =
        (botao && botao.getAttribute("data-id")) ||
        container.getAttribute("data-id");
    const dadosCatalogo = (idAttr && CATALOGO_PRODUTOS[idAttr]) || {};

    const nomeAttr = botao && botao.getAttribute("data-nome");
    const precoAttr = botao && botao.getAttribute("data-preco");
    const iconeAttr =
        (botao && botao.getAttribute("data-icone")) ||
        container.getAttribute("data-icone");

    const nome = nomeAttr || (tituloEl ? tituloEl.textContent.trim() : dadosCatalogo.nome || "Produto CompSis");
    const preco = precoAttr
        ? parseFloat(precoAttr)
        : dadosCatalogo.preco || extrairPrecoTexto(container.textContent);
    const icone = iconeAttr || dadosCatalogo.icone || (iconeEl ? iconeEl.textContent.trim() : "📦");
    const imagem = imagemEl ? imagemEl.src : dadosCatalogo.imagem || "";
    const descricao = dadosCatalogo.descricao || "";
    const especificacoes = dadosCatalogo.especificacoes || [];

    return {
        id: idAttr || nome.toLowerCase().replace(/\s+/g, "-"),
        nome,
        preco,
        quantidade: 1,
        icone,
        imagem,
        descricao,
        especificacoes
    };
}

function inicializarCatalogoEProduto() {
    // 1. Torna os cards da Home clicáveis para abrir produto.html (sem interferir no botão Adicionar ao Carrinho)
    const cardsHome = document.querySelectorAll("#produtos .card-produto, #produtos article");
    cardsHome.forEach((card) => {
        const btnAdd = card.querySelector(".btn-adicionar-carrinho, button");
        const dadosProduto = extrairDadosDoCard(card, btnAdd);

        const elementosClicaveis = card.querySelectorAll("h3, .icone-produto, img");
        elementosClicaveis.forEach((el) => {
            el.style.cursor = "pointer";
            el.title = `Ver detalhes de ${dadosProduto.nome}`;
            el.addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.setItem("compsis_produto_selecionado", JSON.stringify(dadosProduto));
                window.location.href = `produto.html?id=${encodeURIComponent(dadosProduto.id)}`;
            });
        });
    });

    // 2. Se estivermos na página produto.html (que o Luís está criando), preenche automaticamente o produto clicado
    const estaNaPaginaProduto =
        window.location.pathname.toLowerCase().includes("produto.html") ||
        document.querySelector(".produto-detalhe, #detalhe-produto, #pagina-produto") !== null;

    if (estaNaPaginaProduto) {
        const params = new URLSearchParams(window.location.search);
        const idUrl = params.get("id");
        const salvoStorage = JSON.parse(localStorage.getItem("compsis_produto_selecionado") || "null");

        const produtoAtivo =
            (idUrl && CATALOGO_PRODUTOS[idUrl]) ||
            salvoStorage ||
            CATALOGO_PRODUTOS["memoria-ram-16gb"];

        if (produtoAtivo) {
            document.title = `${produtoAtivo.nome} - CompSis Shop`;

            const elTitulo = document.querySelector("main h1, main h2, #nome-produto, .titulo-produto");
            if (elTitulo) elTitulo.textContent = produtoAtivo.nome;

            const elImagem = document.querySelector("main img, #imagem-produto, .imagem-produto");
            if (elImagem && produtoAtivo.imagem) {
                elImagem.src = produtoAtivo.imagem;
                elImagem.alt = produtoAtivo.nome;
            }

            const elPreco = document.querySelector("#preco-produto, .preco-produto, main strong");
            if (elPreco && (elPreco.textContent.includes("R$") || elPreco.id === "preco-produto")) {
                elPreco.textContent = formatarMoeda(produtoAtivo.preco);
            }

            const elDescricao = document.querySelector("#descricao-produto, .descricao-produto");
            if (elDescricao && produtoAtivo.descricao) {
                elDescricao.textContent = produtoAtivo.descricao;
            }

            const btnAddProduto = document.querySelector(".btn-adicionar-carrinho, .btn-adicionar, main button");
            if (btnAddProduto) {
                btnAddProduto.setAttribute("data-id", produtoAtivo.id);
                btnAddProduto.setAttribute("data-nome", produtoAtivo.nome);
                btnAddProduto.setAttribute("data-preco", produtoAtivo.preco);
                btnAddProduto.setAttribute("data-icone", produtoAtivo.icone || "📦");
            }

            // Se o Luís colocar ou não um campo de CEP na produto.html, sincronizamos ou injetamos o simulador de frete
            let containerFreteProduto = document.querySelector(".simulador-frete, #frete-produto, #calculo-frete");
            if (!containerFreteProduto && btnAddProduto) {
                containerFreteProduto = document.createElement("div");
                containerFreteProduto.className = "simulador-frete";
                containerFreteProduto.innerHTML = `
                    <label for="cep-frete-produto"><strong>Calcular frete e prazo:</strong></label>
                    <div class="linha-cep-frete">
                        <input type="text" id="cep-frete-produto" placeholder="Digite seu CEP (00000-000)" inputmode="numeric" maxlength="9">
                        <button type="button" id="btn-calcular-frete-produto">Calcular</button>
                    </div>
                    <div id="opcoes-frete" class="opcoes-frete" aria-live="polite"></div>
                `;
                btnAddProduto.insertAdjacentElement("afterend", containerFreteProduto);
            }
            if (containerFreteProduto) {
                montarWidgetFrete(containerFreteProduto);
            }
        }
    }

    // 3. Eventos dos botões "Adicionar ao carrinho" (Home e Produto)
    const botoes = document.querySelectorAll("button, a.btn-adicionar, .btn-adicionar-carrinho");
    botoes.forEach((botao) => {
        const textoBotao = botao.textContent.trim().toLowerCase();
        if (
            botao.classList.contains("btn-adicionar-carrinho") ||
            botao.classList.contains("btn-adicionar") ||
            textoBotao.includes("adicionar ao carrinho") ||
            textoBotao.includes("comprar agora")
        ) {
            botao.addEventListener("click", (e) => {
                e.preventDefault();
                const container = botao.closest("article, .produto-detalhe, .card-produto, main") || document;
                const inputQtdPagina = container.querySelector('input[type="number"]');
                const produto = extrairDadosDoCard(container, botao);
                if (inputQtdPagina) {
                    produto.quantidade = Math.max(1, parseInt(inputQtdPagina.value, 10) || 1);
                }
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
    const elValorFrete = document.getElementById("valor-frete-carrinho");
    const elPrecoTotal = document.getElementById("preco-total");
    const btnFinalizar = document.getElementById("btn-finalizar-pedido");

    if (!secaoItens && !elTotalItens && !elPrecoTotal) return;

    let listaContainer = document.getElementById("lista-carrinho");
    if (!listaContainer && secaoItens) {
        listaContainer = document.createElement("div");
        listaContainer.id = "lista-carrinho";
        const artigosExistentes = secaoItens.querySelectorAll("article");
        artigosExistentes.forEach((art) => listaContainer.appendChild(art));
        secaoItens.appendChild(listaContainer);
    }

    function atualizarTotaisResumo() {
        const carrinho = obterCarrinho();
        const totalUnidades = calcularTotalUnidades(carrinho);
        const subtotal = calcularValorTotal(carrinho);
        const frete = obterFreteSelecionado();
        const valorFrete = (carrinho.length > 0 && frete) ? Number(frete.preco) || 0 : 0;
        const totalGeral = subtotal + valorFrete;

        if (elTotalItens) {
            elTotalItens.textContent = totalUnidades;
        }
        if (elSubtotalPedido) {
            elSubtotalPedido.textContent = formatarMoeda(subtotal);
        }
        if (elValorFrete) {
            elValorFrete.textContent = frete
                ? `${formatarMoeda(valorFrete)} (${frete.transportadora} - ${frete.prazo})`
                : "calculado pelo CEP acima";
        }
        if (elPrecoTotal) {
            elPrecoTotal.textContent = formatarMoeda(totalGeral);
        }
    }

    function renderizarCarrinho() {
        const carrinho = obterCarrinho();
        atualizarTotaisResumo();

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
            const dadosCatalogo = CATALOGO_PRODUTOS[item.id] || {};
            const precoUnitario = Number(item.preco) || 0;
            const quantidade = Math.max(1, Number(item.quantidade) || 1);
            const subtotalItem = precoUnitario * quantidade;
            const inputId = `quantidade-item-${index}`;
            const imagemUrl = item.imagem || dadosCatalogo.imagem || "";

            const article = document.createElement("article");
            article.className = "item-carrinho";
            article.setAttribute("data-id", item.id || index);

            const midiaHtml = imagemUrl
                ? `<p class="icone-produto"><img src="${imagemUrl}" alt="${item.nome}"></p>`
                : `<p>${item.icone || "📦"}</p>`;

            article.innerHTML = `
                <h3>${item.nome}</h3>
                ${midiaHtml}
                <p>Preço unitário: ${formatarMoeda(precoUnitario)}</p>
                <label for="${inputId}">Quantidade</label>
                <input type="number" id="${inputId}" class="input-quantidade" min="1" value="${quantidade}">
                <p>Subtotal: <span class="subtotal-item">${formatarMoeda(subtotalItem)}</span></p>
                <button type="button" class="btn-remover-item">Remover produto</button>
                <a href="home.html#produtos">Continuar comprando</a>
            `;

            const tituloClicavel = article.querySelector("h3");
            const imgClicavel = article.querySelector("img");
            [tituloClicavel, imgClicavel].forEach((el) => {
                if (!el) return;
                el.style.cursor = "pointer";
                el.addEventListener("click", () => {
                    const prodDetalhe = dadosCatalogo.id ? dadosCatalogo : item;
                    localStorage.setItem("compsis_produto_selecionado", JSON.stringify(prodDetalhe));
                    window.location.href = `produto.html?id=${encodeURIComponent(item.id || "")}`;
                });
            });

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

    // Inicializa o simulador de frete no Resumo do Pedido
    const containerFrete = document.querySelector(".simulador-frete");
    if (containerFrete) {
        montarWidgetFrete(containerFrete, () => {
            atualizarTotaisResumo();
        });
    }

    renderizarCarrinho();

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
