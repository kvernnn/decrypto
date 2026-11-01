import assert from 'assert';
import http from 'http';
import { WebSocket } from 'ws';

async function runIntegration() {
  console.log('--- Testing REST & WebSocket Integration with 4 Players ---');
  const port = 3000;
  const baseUrl = `http://localhost:${port}`;

  // 1. Create lobby via REST
  const createRes = await fetch(`${baseUrl}/api/lobby/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName: 'Host_Alice' }),
  });
  assert.strictEqual(createRes.status, 200);
  const createData = await createRes.json();
  assert.ok(createData.success);
  const { lobbyId, sessionId: hostSessionId, playerId: hostPlayerId } = createData;
  console.log(`✓ Lobby created: ${lobbyId}`);

  // 2. Join 3 other players
  const p2Res = await fetch(`${baseUrl}/api/lobby/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lobbyId, playerName: 'Bob_Blue', sessionId: 'sess_bob' }),
  });
  const p2Data = await p2Res.json();
  assert.ok(p2Data.success);

  const p3Res = await fetch(`${baseUrl}/api/lobby/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lobbyId, playerName: 'Charlie_Red', sessionId: 'sess_charlie' }),
  });
  const p3Data = await p3Res.json();
  assert.ok(p3Data.success);

  const p4Res = await fetch(`${baseUrl}/api/lobby/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lobbyId, playerName: 'Diana_Red', sessionId: 'sess_diana' }),
  });
  const p4Data = await p4Res.json();
  assert.ok(p4Data.success);

  console.log('✓ 4 Players registered into lobby');

  // 3. Connect WebSockets for all 4 players
  const connectWs = (sessionId: string, playerName: string) => {
    return new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws?lobbyId=${lobbyId}&sessionId=${sessionId}&playerName=${playerName}`);
      ws.on('open', () => resolve(ws));
      ws.on('error', (err) => reject(err));
    });
  };

  const ws1 = await connectWs(hostSessionId, 'Host_Alice');
  const ws2 = await connectWs('sess_bob', 'Bob_Blue');
  const ws3 = await connectWs('sess_charlie', 'Charlie_Red');
  const ws4 = await connectWs('sess_diana', 'Diana_Red');

  console.log('✓ 4 WebSockets connected simultaneously');

  // Listen for state update on ws1
  const statePromise = new Promise<any>((resolve) => {
    ws1.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'state_update') {
        resolve(msg.state);
      }
    });
  });

  // Host randomises teams
  ws1.send(JSON.stringify({ type: 'randomise_teams' }));
  const updatedState = await statePromise;
  assert.strictEqual(updatedState.players.length, 4);
  console.log('✓ Real-time state update broadcast across WebSockets');

  // Clean up sockets
  ws1.close();
  ws2.close();
  ws3.close();
  ws4.close();

  console.log('=== INTEGRATION TEST PASSED! ===');
}

runIntegration().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
