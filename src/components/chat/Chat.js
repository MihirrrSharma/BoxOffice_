import { useState } from "react";
import { fetchAIResponse } from "../../constants";
import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import { trackUserActivity } from "../../constants";
import "./Chat.css";

const Chat = ({ currentMovie }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 
  [messages]);

  useEffect(() => {
    const saved = localStorage.getItem("chatMessages");
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (messages.length > 20) {
      setMessages((prev) => prev.slice(-20));
    } else {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const currentInput = input; // store before clearing

    // track search activity (with debounce + trim)
    trackUserActivity({ search: currentInput });
    setInput(""); // clear immediately (UX fix)

    const userMsg = { role: "user", text: currentInput };
    setMessages((prev) => [...prev, userMsg]);

    try {
      setLoading(true);
      const res = await fetchAIResponse(currentInput, {
        currentMovie: currentMovie?.title,
      });

      setLoading(false);
      const botMsg = {
        role: "bot",
        data: res.data,
        text: res.text,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.log(err);
      setLoading(false); // 🔥 important
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="chat-toggle" onClick={() => setOpen(!open)}>
        💬
      </div>

      {/* Chat Panel */}
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>AI Movie Assistant</span>
            <button className="chat-close" onClick={() => setOpen(false)}>✖</button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg-row ${m.role}`}>
                {m.role === "user" ? (
                  <div className="user-msg">{m.text}</div>
                ) : (
                  <div className="bot-group">

                    {/* ✅ TEXT RESPONSE (like greeting) */}
                    {m.text && <div className="bot-msg">{m.text}</div>}

                    {/* ✅ MOVIE CARDS */}
                    {m.data &&
                      m.data.map((movie, idx) => (
                        <div
                          key={idx}
                          className="bot-msg movie-card clickable"
                          onClick={() => {
                            if (!movie.id) return;

                            // track movie click activity
                            trackUserActivity({
                              movie: {
                                title: movie.title,
                                genres: [],
                              },
                            });

                            navigate(`/movie/${movie.id}`);
                          }}
                        >
                          <img
                            src={
                              movie.poster ||
                              "https://dummyimage.com/80x120/000/fff&text=No"
                            }
                            alt={movie.title}
                          />
                          <div>
                            <strong>{movie.title}</strong>
                            <p>{movie.reason}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}

            {loading && <div className="bot-msg">Typing...</div>}
            <div ref={bottomRef}></div>
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask for movies..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
        
      )}
    </>
  );
};

export default Chat;