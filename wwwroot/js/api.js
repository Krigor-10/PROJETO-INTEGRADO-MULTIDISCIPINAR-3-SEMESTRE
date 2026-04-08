async function apiPost(endpoint, payload) {
    const resposta = await fetch(`${window.APP_CONFIG.API_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    let dados = {};

    try {
        dados = await resposta.json();
    } catch { }

    return { resposta, dados };
}