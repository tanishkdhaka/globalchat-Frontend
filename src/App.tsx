import { useEffect, useRef, useState } from "react";

type Message = {
  type: string;
  username?: string;
  body?: string;
  count?: number;
};

function App() {
  const socketRef = useRef<WebSocket | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [input, setInput] = useState("");
  const [usersOnline, setUsersOnline] = useState(0);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/ws");
    socketRef.current = ws;

    const savedUsername = localStorage.getItem("username");

    ws.onopen = () => {
      if (savedUsername) {
        ws.send(
          JSON.stringify({
            type: "join",
            username: savedUsername,
          })
        );

        setUsername(savedUsername);
        setJoined(true);
      }
    };

    ws.onmessage = (event) => {
      const data: Message = JSON.parse(event.data);

      if (data.type === "chat") {
        setMessages((prev) => [...prev, data]);
      }

      if (data.type === "users_count") {
        setUsersOnline(data.count ?? 0);
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const joinChat = () => {
    if (!socketRef.current || username.trim() === "") return;

    const name = username.trim();

    socketRef.current.send(
      JSON.stringify({
        type: "join",
        username: name,
      })
    );

    localStorage.setItem("username", name);

    setJoined(true);
  };

  const sendMessage = () => {
    if (!socketRef.current || input.trim() === "") return;

    socketRef.current.send(
      JSON.stringify({
        type: "chat",
        body: input.trim(),
      })
    );

    setInput("");
  };

  const logout = () => {
    localStorage.removeItem("username");
    location.reload();
  };

  return (
    <div className="flex w-screen min-h-screen bg-gray-900 text-white">
      <div className="flex w-full mx-auto max-w-3xl flex-col p-6">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Global Chat</h1>

          {joined && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {usersOnline} online
              </span>

              <button
                onClick={logout}
                className="text-sm px-3 py-1 rounded bg-red-500 hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* JOIN SCREEN */}

        {!joined ? (
          <div className="flex flex-col items-center justify-center gap-6 mt-20">

            <div className="w-full max-w-md flex flex-col gap-4">

              <label className="text-sm text-gray-400">
                Enter your username
              </label>

              <input
                className="h-10 px-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <button
                onClick={joinChat}
                className="h-10 rounded bg-blue-600 hover:bg-blue-700 transition"
              >
                Join Chat
              </button>

            </div>
          </div>
        ) : (
          <>
            {/* CHAT MESSAGES */}

            <div
              ref={chatRef}
              className="flex flex-col gap-2 border border-gray-700 rounded p-4 h-[60vh] overflow-y-auto bg-gray-800"
            >
              {messages.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="font-semibold text-blue-400">
                    {msg.username}
                  </span>{" "}
                  <span className="text-gray-200">{msg.body}</span>
                </div>
              ))}
            </div>

            {/* MESSAGE INPUT */}

            <form
  onSubmit={(e) => {
    e.preventDefault()
    sendMessage()
  }}
  className="flex gap-3 mt-4"
>
  <input
    className="flex-1 h-10 px-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder="Type message..."
  />

  <button
    type="submit"
    className="px-5 rounded bg-blue-600 hover:bg-blue-700 transition"
  >
    Send
  </button>
</form>
          </>
        )}
      </div>
    </div>
  );
}

export default App;