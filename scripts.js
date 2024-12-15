// Variables globales
let provider;
let signer;
let simpleDex;
let tokenA;
let tokenB;
let selectedToken;

// Direcciones de los contratos
const tokenAAddress = '0x5095418EbCC5535bdF38D515ACBb8a7648B85336';
const tokenBAddress = '0xfF5093e973e11D4a132d46626e118935558A1a37';
const simpleDexAddress = '0x1E7BB2b10cc7Dbc1572D657052f389dC7a606254';

// Cargar ABIs desde archivos externos
async function loadABI(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Error al cargar ABI desde ${path}`);
    return await response.json();
}

// Inicializar proveedor y contratos
async function initializeProvider() {
    if (window.ethereum) {
        console.log('MetaMask está instalado');
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        await window.ethereum.enable();

        const [simpleDexABI, tokenAABI, tokenBABI] = await Promise.all([
            loadABI('./Abi/SimpleDex.json'),
            loadABI('./Abi/TokenA.json'),
            loadABI('./Abi/TokenB.json')
        ]);

        // Instanciamos los contratos
        simpleDex = new ethers.Contract(simpleDexAddress, simpleDexABI, signer);
        tokenA = new ethers.Contract(tokenAAddress, tokenAABI, signer);
        tokenB = new ethers.Contract(tokenBAddress, tokenBABI, signer);

        // Actualizamos la interfaz de usuario
        updateWalletInfo();
    } else {
        alert('Por favor, instala Metamask!');
    }
}

// Función para agregar liquidez
async function addLiquidity() {
    const tokenAAmount = document.getElementById('liquidityTokenA').value;
    const tokenBAmount = document.getElementById('liquidityTokenB').value;

    if (tokenAAmount <= 0 || tokenBAmount <= 0) {
        alert('Por favor ingresa cantidades válidas');
        return;
    }

    try {
        // Aprobar los tokens antes de agregar liquidez
        await tokenA.approve(simpleDexAddress, ethers.utils.parseUnits(tokenAAmount, 18));
        await tokenB.approve(simpleDexAddress, ethers.utils.parseUnits(tokenBAmount, 18));

        // Llamar la función para agregar liquidez
        const tx = await simpleDex.addLiquidity(
            ethers.utils.parseUnits(tokenAAmount, 18),
            ethers.utils.parseUnits(tokenBAmount, 18)
        );
        await tx.wait();
        alert('Liquidez agregada exitosamente');
    } catch (error) {
        console.error('Error al agregar liquidez:', error);
        alert('Error al agregar liquidez');
    }
}

// Función para retirar liquidez
async function removeLiquidity() {
    const tokenAAmount = document.getElementById('removeLiquidityTokenA').value;
    const tokenBAmount = document.getElementById('removeLiquidityTokenB').value;

    if (tokenAAmount <= 0 || tokenBAmount <= 0) {
        alert('Por favor ingresa cantidades válidas');
        return;
    }

    try {
        // Llamar la función para retirar liquidez
        const tx = await simpleDex.removeLiquidity(
            ethers.utils.parseUnits(tokenAAmount, 18),
            ethers.utils.parseUnits(tokenBAmount, 18)
        );
        await tx.wait();
        alert('Liquidez retirada exitosamente');
    } catch (error) {
        console.error('Error al retirar liquidez:', error);
        alert('Error al retirar liquidez');
    }
}

// Función para intercambiar tokens
async function swapTokens() {
    const swapAmount = document.getElementById('swapAmount').value;
    const fromToken = document.getElementById('swapFromToken').value;
    const toToken = document.getElementById('swapToToken').value;

    if (swapAmount <= 0) {
        alert('Por favor ingresa una cantidad válida');
        return;
    }

    const amountIn = ethers.utils.parseUnits(swapAmount, 18);

    try {
        let tx;
        if (fromToken === 'Token A' && toToken === 'Token B') {
            // Aprobar Token A para el intercambio
            await tokenA.approve(simpleDexAddress, amountIn);
            tx = await simpleDex.swapTokenAForTokenB(amountIn);
        } else if (fromToken === 'Token B' && toToken === 'Token A') {
            // Aprobar Token B para el intercambio
            await tokenB.approve(simpleDexAddress, amountIn);
            tx = await simpleDex.swapTokenBForTokenA(amountIn);
        }

        await tx.wait();
        alert('Intercambio exitoso');
    } catch (error) {
        console.error('Error al intercambiar tokens:', error);
        alert('Error al intercambiar tokens');
    }
}

// Función para obtener el precio del token
async function getTokenPrice() {
    const tokenToGetPrice = document.getElementById('swapFromToken').value; // Obtener el valor seleccionado
    let tokenAddress;

    // Determinar la dirección del token seleccionado
    if (tokenToGetPrice === 'Token A') {
        tokenAddress = tokenAAddress;
    } else if (tokenToGetPrice === 'Token B') {
        tokenAddress = tokenBAddress;
    } else {
        alert('Token no válido');
        return;
    }

    try {
        // Llamar a la función `getPrice` pasando la dirección del token
        const price = await simpleDex.getPrice(tokenAddress);

        // Verificar si el precio es válido antes de mostrarlo
        if (price && price.gt(0)) {
            // Mostrar el precio en la interfaz, formato adecuado
            document.getElementById('priceOutput').textContent = `Precio: ${ethers.utils.formatUnits(price, 18)} ETH`;
        } else {
            document.getElementById('priceOutput').textContent = "Precio no disponible";
        }
    } catch (error) {
        console.error('Error al obtener precio:', error);
        alert('Error al obtener precio');
    }
}

// Función para obtener el balance de Token A
async function getTokenABalance() {
    try {
        const balance = await tokenA.balanceOf(await signer.getAddress());
        document.getElementById('priceOutput').textContent = `Balance de Token A: ${ethers.utils.formatUnits(balance, 18)}`;
    } catch (error) {
        console.error('Error al obtener balance de Token A:', error);
        alert('Error al obtener balance de Token A');
    }
}

// Función para obtener el balance de Token B
async function getTokenBBalance() {
    try {
        const balance = await tokenB.balanceOf(await signer.getAddress());
        document.getElementById('priceOutput').textContent = `Balance de Token B: ${ethers.utils.formatUnits(balance, 18)}`;
    } catch (error) {
        console.error('Error al obtener balance de Token B:', error);
        alert('Error al obtener balance de Token B');
    }
}

// Función para conectar la wallet
document.getElementById('walletButton').addEventListener('click', () => {
    initializeProvider();
});

// Funciones de interacción con el contrato
document.getElementById('addLiquidityButton').addEventListener('click', addLiquidity);
document.getElementById('swapButton').addEventListener('click', swapTokens);
document.getElementById('getPriceButton').addEventListener('click', getTokenPrice);
document.getElementById('getTokenABalanceButton').addEventListener('click', getTokenABalance);
document.getElementById('getTokenBBalanceButton').addEventListener('click', getTokenBBalance);

// Actualizar la información de la wallet conectada
async function updateWalletInfo() {
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();
    const gasPrice = await provider.getGasPrice();

    // Actualizamos los datos en la interfaz
    document.getElementById('walletAddress').textContent = address;
    document.getElementById('walletBalance').textContent = ethers.utils.formatEther(balance);
    document.getElementById('walletNetwork').textContent = network.name;

    // Mostrar la sección de funciones
    document.getElementById('walletInfo').classList.remove('d-none');
    document.getElementById('walletButton').classList.add('d-none');
}
