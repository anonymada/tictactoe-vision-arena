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

**HTTP ****`200 OK`**

```json
{
  "player": {}
}
```

### Error response

If `name` is missing:

**HTTP ****`400 Bad Request`**

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
  "player": 1,
  "row": 0,
  "col": 2
}
```

### Parameters

| Field    | Type     | Required | Description       |
| -------- | -------- | -------: | ----------------- |
| `player` | `number` |      Yes | Player identifier |
| `row`    | `number` |      Yes | Board row         |
| `col`    | `number` |      Yes | Board column      |

### Success response

**HTTP ****`200 OK`**

```json
{
  "success": true,
  "board": [],
  "nextPlayer": 2,
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

**HTTP ****`400 Bad Request`**

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

**HTTP ****`200 OK`**

```json
{
  "board": [],
  "currentPlayer": 1,
  "winner": null
}
```

The response contains:

| Field           | Description               |
| --------------- | ------------------------- |
| `board`         | Current Tic-Tac-Toe board |
| `currentPlayer` | Player whose turn it is   |
| `winner`        | Current winner state      |


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

**HTTP ****`200 OK`**

```json
{
  "success": true,
  "state": {
    "board": [],
    "currentPlayer": 1,
    "winner": null
  }
}
```

### Error response

If an unexpected error occurs:

**HTTP ****`500 Internal Server Error`**

```json
{
  "success": false,
  "error": "Error message"
}
```

### Socket.IO event

After the reset, the server broadcasts:

```text
state
```

with the new game state.

---

# HTTP Status Codes

| Status | Meaning                           | Used by                                  |
| ------ | --------------------------------- | ---------------------------------------- |
| `200`  | Request successfully processed    | `/register`, `/move`, `/state`, `/reset` |
| `400`  | Invalid request or game operation | `/register`, `/move`                     |
| `500`  | Internal server error             | `/reset`                                 |

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
io.emit('state', state)
```

This means that **all connected Socket.IO clients receive the new/current game state**.

### Example client

```js
socket.on('state', (state) => {
  console.log('Game state:', state);
});
```

---

# API Usage Example

A typical game flow can be:

```text
1. Register player
        |
        v
POST /register
        |
        v
2. Get game state
        |
        v
GET /state
        |
        v
3. Play a move
        |
        v
POST /move
        |
        v
4. Receive updated state
   through Socket.IO
        |
        v
5. Continue playing
        |
        v
6. Reset when necessary
        |
        v
POST /reset
```

---

## Real-time synchronization

```text
REST API
    |
    +-- POST /register
    +-- POST /move
    +-- GET  /state
    +-- POST /reset

Socket.IO
    |
    +-- state
```

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
