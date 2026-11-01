import assert from 'assert';
import {
  createNewGame,
  addPlayerToGame,
  randomiseTeams,
  setPlayerTeam,
  setGameMode,
  startGame,
  submitClues,
  submitSuggestion,
  lockGuess,
  updateTeamNotes,
  sendChatMessage,
  filterStateForPlayer,
  handlePlayerDisconnect,
  submitTiebreakerGuesses,
} from '../server/gameMachine.js';
import { generateCode, ALL_VALID_CODES } from '../server/words.js';
import { store } from '../server/store.js';

console.log('=== RUNNING DECRYPTO FULL ENGINE & SECURITY VERIFICATION ===');

// TEST 1: Code Generation in Traditional and No-Repeat modes
console.log('\n--- Test 1: Code Generation Rules ---');
for (let i = 0; i < 50; i++) {
  const code = generateCode('traditional', []);
  assert.strictEqual(code.length, 3, 'Code must have 3 digits');
  const set = new Set(code);
  assert.strictEqual(set.size, 3, 'Code must never repeat a digit within a single code');
  for (const d of code) {
    assert.ok(d >= 1 && d <= 4, 'Digits must be between 1 and 4');
  }
}

// Test No-Repeat mode: ensure used codes are not repeated
const used: string[] = [];
for (let i = 0; i < 24; i++) {
  const code = generateCode('no-repeat', used);
  const str = code.join('-');
  assert.ok(!used.includes(str), `No-repeat mode generated duplicate sequence: ${str}`);
  used.push(str);
}
console.log('✓ Code generation verified (3 distinct digits, traditional & no-repeat pool handling)');

// TEST 2: Lobby Creation & Secure Sessions
console.log('\n--- Test 2: Lobby Creation & Player Roster ---');
const hostSession = 'session_host_alice';
const game = createNewGame(hostSession, 'Alice');
assert.ok(game.lobbyId, 'Lobby ID should exist');
assert.strictEqual(game.players.length, 1, 'Lobby should have 1 player');
assert.strictEqual(game.players[0].isHost, true, 'First player is host');

// Add 3 more players
const bob = addPlayerToGame(game, 'session_bob', 'Bob');
const charlie = addPlayerToGame(game, 'session_charlie', 'Charlie');
const diana = addPlayerToGame(game, 'session_diana', 'Diana');
assert.strictEqual(game.players.length, 4, 'Should have 4 players');

// Test Start Game with unbalanced teams (<2 per team)
setPlayerTeam(game, game.players[0].id, 'blue');
setPlayerTeam(game, bob.id, 'blue');
setPlayerTeam(game, charlie.id, 'blue');
setPlayerTeam(game, diana.id, 'red'); // Only 1 on red

const startFailed = startGame(game, game.hostId);
assert.strictEqual(startFailed.success, false, 'Should fail to start with only 1 red player');
console.log('✓ Lobby minimums enforced (rejected start with < 2 players on a team)');

// Test Randomise Teams
const randResult = randomiseTeams(game, game.hostId);
assert.strictEqual(randResult.success, true);
const blueCount = game.players.filter((p) => p.team === 'blue').length;
const redCount = game.players.filter((p) => p.team === 'red').length;
assert.ok(Math.abs(blueCount - redCount) <= 1, 'Teams must be balanced within 1 player');
assert.strictEqual(blueCount + redCount, 4, 'All 4 players must be assigned');
console.log(`✓ Balanced randomisation verified: Blue=${blueCount}, Red=${redCount}`);

// Manually balance for predictable testing: 2 Blue, 2 Red
setPlayerTeam(game, game.players[0].id, 'blue');
setPlayerTeam(game, bob.id, 'blue');
setPlayerTeam(game, charlie.id, 'red');
setPlayerTeam(game, diana.id, 'red');

// TEST 3: Mode selection & Game Start
console.log('\n--- Test 3: Game Start & Secret Initialization ---');
setGameMode(game, game.hostId, 'no-repeat');
assert.strictEqual(game.mode, 'no-repeat');

const startSuccess = startGame(game, game.hostId);
assert.strictEqual(startSuccess.success, true);
assert.strictEqual(game.phase, 'ROUND_CLUES');
assert.strictEqual(game.round, 1);
assert.ok(game.blueCurrentCode);
assert.ok(game.redCurrentCode);
console.log('✓ Game started into ROUND_CLUES with unique secret keywords & codes');

// TEST 4: Keyword and Code Secrecy in Filtered Responses
console.log('\n--- Test 4: Keyword & Secret Code Filtering ---');
const aliceFiltered = filterStateForPlayer(game, game.players[0].id);
const charlieFiltered = filterStateForPlayer(game, charlie.id);

// Alice is on Blue team
assert.ok(aliceFiltered.ourKeywords, 'Alice sees Blue keywords');
assert.strictEqual(aliceFiltered.opponentKeywordsRevealed, null, 'Alice MUST NOT see Red keywords');

// Charlie is on Red team
assert.ok(charlieFiltered.ourKeywords, 'Charlie sees Red keywords');
assert.strictEqual(charlieFiltered.opponentKeywordsRevealed, null, 'Charlie MUST NOT see Blue keywords');

// Secret code secrecy
const blueEncryptorId = game.blueEncryptorOrder[game.blueEncryptorIndex];
const redEncryptorId = game.redEncryptorOrder[game.redEncryptorIndex];
const blueEncryptorFiltered = filterStateForPlayer(game, blueEncryptorId);
const blueTeammateId = game.blueEncryptorOrder.find((id) => id !== blueEncryptorId)!;
const blueTeammateFiltered = filterStateForPlayer(game, blueTeammateId);

assert.ok(blueEncryptorFiltered.mySecretCode, 'Blue Encryptor receives mySecretCode');
assert.strictEqual(blueTeammateFiltered.mySecretCode, null, 'Blue teammate MUST NOT receive secret code');
console.log('✓ Secrecy verified: opponent keywords and teammate codes are strictly redacted on server');

// TEST 5: Clue Submissions and Clue Rules
console.log('\n--- Test 5: Clue Submissions & Rule Enforcement ---');
// Forbidden clue: keyword itself
const blueKw1 = game.blueKeywords[1];
const illegalClueResult = submitClues(game, blueEncryptorId, [blueKw1, 'Orbit', 'Rocket']);
assert.strictEqual(illegalClueResult.success, false, 'Clue matching keyword must be rejected');
console.log('✓ Forbidden clue matching keyword was rejected');

// Valid clue submission
const validBlueClues = submitClues(game, blueEncryptorId, ['AlphaClueOne', 'BetaClueTwo', 'GammaClueThree']);
if (!validBlueClues.success) {
  console.error('validBlueClues error:', validBlueClues.error);
}
assert.strictEqual(validBlueClues.success, true);
assert.strictEqual(game.phase, 'ROUND_CLUES', 'Should remain in ROUND_CLUES until other team submits');

const validRedClues = submitClues(game, redEncryptorId, ['DeltaClueOne', 'EpsilonClueTwo', 'ZetaClueThree']);
if (!validRedClues.success) {
  console.error('validRedClues error:', validRedClues.error);
}
assert.strictEqual(validRedClues.success, true);
assert.strictEqual(game.phase, 'TRANSMISSION_BLUE', 'Both clues submitted -> moves to TRANSMISSION_BLUE');
console.log('✓ Both clues submitted -> advanced to TRANSMISSION_BLUE');

// TEST 6: Round 1 Transmission (No Interception in Round 1)
console.log('\n--- Test 6: Round 1 Transmission Rules (No Interceptions) ---');
const trans = game.currentTransmission!;
assert.strictEqual(trans.team, 'blue');
assert.strictEqual(trans.interceptionLocked, true, 'Interception locked by default in Round 1');
assert.strictEqual(trans.interceptionGuess, null, 'No interception in Round 1');

// Test Encryptor Restrictions:
// Encryptor cannot submit decoding guess for own transmission
const encGuessResult = lockGuess(game, blueEncryptorId, [1, 2, 3]);
assert.strictEqual(encGuessResult.success, false, 'Encryptor cannot lock decoding guess');

// Encryptor cannot send chat messages during unresolved transmission
const encChatResult = sendChatMessage(game, blueEncryptorId, 'Hey team, guess 4-2-1');
assert.strictEqual(encChatResult.success, false, 'Encryptor chat blackout enforced');
console.log('✓ Encryptor blackout enforced: cannot guess or chat during own transmission');

// Teammate submits decoding guess
const code = game.blueCurrentCode!;
const decodeResult = lockGuess(game, trans.decodingSubmitterId, code);
assert.strictEqual(decodeResult.success, true);

// Once both locked (interception was already locked in R1), Blue transmission resolves!
// And initiates Red transmission!
assert.strictEqual(game.phase, 'TRANSMISSION_RED');
console.log('✓ Blue transmission resolved -> advanced to TRANSMISSION_RED');

// Red transmission in Round 1
const redTrans = game.currentTransmission!;
assert.strictEqual(redTrans.team, 'red');
const redCode = game.redCurrentCode!;
const redDecodeResult = lockGuess(game, redTrans.decodingSubmitterId, redCode);
assert.strictEqual(redDecodeResult.success, true);

// Both transmissions in Round 1 complete -> Advances to Round 2!
assert.strictEqual(game.round, 2, 'Should advance to Round 2');
assert.strictEqual(game.phase, 'ROUND_CLUES', 'Should return to ROUND_CLUES');
assert.strictEqual(game.history.length, 1, 'Round 1 recorded in history');
console.log('✓ Round 1 completed and advanced to Round 2 with rotated encryptors');

// TEST 7: Round 2 with Interceptions & Scoring
console.log('\n--- Test 7: Round 2 Interceptions and Token Scoring ---');
const r2BlueEnc = game.blueEncryptorOrder[game.blueEncryptorIndex];
const r2RedEnc = game.redEncryptorOrder[game.redEncryptorIndex];

const c1 = submitClues(game, r2BlueEnc, ['Round2BlueOne', 'Round2BlueTwo', 'Round2BlueThree']);
assert.strictEqual(c1.success, true);
const c2 = submitClues(game, r2RedEnc, ['Round2RedOne', 'Round2RedTwo', 'Round2RedThree']);
assert.strictEqual(c2.success, true);
assert.strictEqual(game.phase, 'TRANSMISSION_BLUE');

const r2Trans = game.currentTransmission!;
assert.strictEqual(r2Trans.interceptionLocked, false, 'Round 2 has interception unlocked');

// Red attempts interception of Blue's transmission
const r2BlueCode = game.blueCurrentCode!;
// Guess correctly to earn an Interception token!
const interceptResult = lockGuess(game, r2Trans.interceptionSubmitterId, r2BlueCode);
assert.strictEqual(interceptResult.success, true);

// Blue decodes incorrectly to earn a Miscommunication token!
const wrongCode: [number, number, number] = [
  r2BlueCode[1],
  r2BlueCode[0],
  r2BlueCode[2],
];
const wrongDecodeResult = lockGuess(game, r2Trans.decodingSubmitterId, wrongCode);
assert.strictEqual(wrongDecodeResult.success, true);

// Both locked -> Resolves Blue transmission
assert.strictEqual(game.scores.red.interceptions, 1, 'Red earned +1 Interception token');
assert.strictEqual(game.scores.blue.miscommunications, 1, 'Blue earned +1 Miscommunication token');
console.log('✓ Scoring verified: Red scored Interception (1), Blue scored Miscommunication (1)');

// TEST 8: Reconnection and Session Preservation
console.log('\n--- Test 8: Reconnection & Seat Restoration ---');
const discResult = handlePlayerDisconnect(bob.sessionId);
assert.strictEqual(discResult.player?.connected, false);
// Reconnect
const recPlayer = addPlayerToGame(game, bob.sessionId, 'Bob');
assert.strictEqual(recPlayer.id, bob.id, 'Same player ID restored');
assert.strictEqual(recPlayer.connected, true, 'Player marked connected');
console.log('✓ Reconnection verified: seat and session restored seamlessly');

console.log('\n=== ALL DECRYPTO CORE RULES & SECURITY TESTS PASSED! ===');
