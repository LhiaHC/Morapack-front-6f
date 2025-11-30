// On pressing Connect this method will be called
export function conectarAWebsocket(): WebSocket {
        const url_base: string | undefined = process.env.NEXT_PUBLIC_MORAPACK_WS_URL;
        let ws = new WebSocket(url_base+"/socket" ?? '');
        return ws;
} 

interface MessageData {
    name: string;
    message: string;
}

export function enviarMensaje(mensaje: string, currentUser: string, ws: WebSocket | null) {
    if (ws) {
        const data: MessageData = {
            name: currentUser || "Anónimo",
            message: mensaje,
        };
        ws.send(JSON.stringify(data));
    }
}
