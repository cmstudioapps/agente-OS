import cmTunnelRaw from 'cm-tunnel';
const cmTunnel = cmTunnelRaw.default || cmTunnelRaw;

export async function createTunnel(port) {
  try {
    const t = await cmTunnel.localtunnel({ port: port });
    console.log(`Tunnel criado: ${t.url}`);
    return t;
  } catch (error) {
    console.error('Error creating tunnel:', error);
    return null;
  }
}
