# API Documentation

### Endpoints

| Method | Endpoint    | Description                |
| ------ | ----------- | -------------------------- |
| `POST` | `/register` | Register a new player      |
| `POST` | `/move`     | Play a move                |
| `GET`  | `/state`    | Get the current game state |
| `POST` | `/reset`    | Reset the game             |

---

# 1. Register a player

## `POST /register`

Registers a player in the current game.

### Request body

Payload:

```json
{
  "name": "Alice",
  "socketId": "abc123"
}
```

### Parameters

| Field      | Type     | Required | Description             |
| ---------- | -------- | -------: | ----------------------- |
| `name`     | `string` |      Yes | Player's name           |
| `socketId` | `string` |       No | Socket.IO connection ID |

If `socketId` is not provided, the API passes `null` to `GameManager`.

### Success response

**HTTP \*\***`200 OK`\*\*

```json
{
  "player": "X"
}
```

### Error response

If `name` is missing:

**HTTP \*\***`400 Bad Request`\*\*

```json
{
  "error": "Missing name"
}
```

---

# 2. Play a move

## `POST /move`

Attempts to place a player's mark on the board.

### Request body

Payload:

```json
{
  "player": "X",
  "row": 1,
  "col": 1
}
```

### Parameters

| Field    | Type     | Required | Description       |
| -------- | -------- | -------: | ----------------- |
| `player` | `X`/`O`  |      Yes | Player identifier |
| `row`    | `number` |      Yes | Board row         |
| `col`    | `number` |      Yes | Board column      |

### Success response

**HTTP \*\***`200 OK`\*\*

```json
{
  "success": true,
  "board": [
    [null, null, null],
    [null, "X", null],
    [null, null, null]
  ],
  "nextPlayer": "O",
  "winner": null
}
```

The response contains:

| Field        | Type                  | Description                            |
| ------------ | --------------------- | -------------------------------------- |
| `success`    | `boolean`             | Indicates that the move was accepted   |
| `board`      | `array`               | Current board                          |
| `nextPlayer` | depends on game state | Current player after the move          |
| `winner`     | depends on game state | Winner information from the game state |

### Missing fields

If `player`, `row`, or `col` is missing:

**HTTP \*\***`400 Bad Request`\*\*

```json
{
  "success": false,
  "error": "Missing fields"
}
```

# 3. Get the current game state

## `GET /state`

Returns the current state of the game.

### Request

```http
GET /state
```

### Success response

**HTTP \*\***`200 OK`\*\*

```json
{
  "board": [
    [null, null, null],
    [null, "X", "O"],
    [null, null, null]
  ],
  "currentPlayer": "X",
  "winner": null,
  "status": "in_progress",
  "moveCount": 2,
  "timeElapsed": 12,
  "players": {
    "X": {
      "name": "Alice",
      "connected": true,
      "avgResponse": null
    },
    "O": {
      "name": "Alice",
      "connected": true,
      "avgResponse": null
    }
  },
  "log": [
    "[2026-08-27T09:44:24.966Z] Move by O: (1,2)",
    "[2026-08-27T09:44:20.687Z] Move by X: (1,1)",
    "[2026-08-27T09:44:16.534Z] Game started",
    "[2026-08-27T09:44:16.534Z] Player registered: Alice as O",
    "[2026-08-27T09:44:14.781Z] Player registered: Alice as X"
  ]
}
```

The response contains:

| Field                   | Description                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `board`                 | Current Tic-Tac-Toe board. Each cell contains `"X"`, `"O"`, or `null` if the cell is empty.              |
| `currentPlayer`         | Player whose turn it is. Can be `"X"` or `"O"`.                                                          |
| `winner`                | Current winner. Contains `"X"` or `"O"` when a player has won, or `null` when there is no winner.        |
| `status`                | Current status of the game. For example, `"in_progress"` indicates that the game is still being played.  |
| `moveCount`             | Number of moves currently played in the game.                                                            |
| `timeElapsed`           | Elapsed time since the game started.                                                                     |
| `players`               | Information about the players registered in the game.                                                    |
| `players.X`             | Information about the player using the `"X"` mark.                                                       |
| `players.O`             | Information about the player using the `"O"` mark.                                                       |
| `players.*.name`        | Name of the registered player.                                                                           |
| `players.*.connected`   | Indicates whether the player is currently connected. `true` means connected, `false` means disconnected. |
| `players.*.avgResponse` | Average response time of the player. `null` when no response-time value is available.                    |
| `log`                   | List of events recorded during the game, including player registration, game start, and moves.           |

---

# 4. Reset the game

## `POST /reset`

Resets the current game to its initial state.

### Request body

None.

### Request

```http
POST /reset
```

### Success response

**HTTP \*\***`200 OK`\*\*

```json
{
  "success": true,
  "state": {
    "board": [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ],
    "currentPlayer": "X",
    "winner": null,
    "status": "waiting",
    "moveCount": 0,
    "timeElapsed": 0,
    "players": {
      "X": {
        "name": null,
        "connected": false,
        "avgResponse": null
      },
      "O": {
        "name": null,
        "connected": false,
        "avgResponse": null
      }
    },
    "log": []
  }
}
```

### Socket.IO event

After the reset, the server broadcasts:

```text
state
```

with the new game state.

---

# Socket.IO Events

The API uses Socket.IO to synchronize the game state with connected clients.

## `state`

The server broadcasts the `state` event when the game state changes.

The event is emitted after:

- A player registers
- A valid move is played
- An invalid move is attempted
- The game is reset

Server-side implementation:

```js
io.emit("state", state);
```

This means that **all connected Socket.IO clients receive the new/current game state**.

### Example client

```js
socket.on("state", (state) => {
  console.log("Game state:", state);
});
```

---

## Content-Type

Endpoints receiving JSON payloads should be called with:

```http
Content-Type: application/json
```

---

# Summary

| Endpoint    | Method | Body                   | Success | Error |
| ----------- | ------ | ---------------------- | ------- | ----- |
| `/register` | `POST` | `name`, `socketId?`    | `200`   | `400` |
| `/move`     | `POST` | `player`, `row`, `col` | `200`   | `400` |
| `/state`    | `GET`  | None                   | `200`   | —     |
| `/reset`    | `POST` | None                   | `200`   | `500` |

All state-changing operations notify connected clients through the Socket.IO `state` event.
