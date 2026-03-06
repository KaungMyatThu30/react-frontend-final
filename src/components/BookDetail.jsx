import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export function BookDetail() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";

  const [book, setBook] = useState(null);
  const [form, setForm] = useState({ title: "", author: "", quantity: 0, location: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setMessage("");

        const result = await fetch(`${API_URL}/api/books/${id}`, {
          credentials: "include",
        });

        if (cancelled) {
          return;
        }

        if (!result.ok) {
          const err = await result.json().catch(() => ({}));
          setMessage(err.message || "Cannot load book");
          setBook(null);
          return;
        }

        const data = await result.json();
        setBook(data);
        setForm({
          title: data.title || "",
          author: data.author || "",
          quantity: data.quantity ?? 0,
          location: data.location || "",
        });
      } catch {
        if (!cancelled) {
          setBook(null);
          setMessage("Cannot load book. Check backend server and API URL.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [API_URL, id]);

  const onUpdate = async (e) => {
    e.preventDefault();
    setMessage("");

    const result = await fetch(`${API_URL}/api/books/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!result.ok) {
      const err = await result.json().catch(() => ({}));
      setMessage(err.message || "Update failed");
      return;
    }

    setMessage("Book updated");

    const reloadResult = await fetch(`${API_URL}/api/books/${id}`, {
      credentials: "include",
    });
    if (!reloadResult.ok) {
      return;
    }

    const data = await reloadResult.json();
    setBook(data);
    setForm({
      title: data.title || "",
      author: data.author || "",
      quantity: data.quantity ?? 0,
      location: data.location || "",
    });
  };

  const onDelete = async () => {
    setMessage("");

    const result = await fetch(`${API_URL}/api/books/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!result.ok) {
      const err = await result.json().catch(() => ({}));
      setMessage(err.message || "Delete failed");
      return;
    }

    navigate("/books");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Book Detail</h2>
      <div>
        <Link to="/books">Back to list</Link> | <Link to="/borrow">Borrow</Link> | <Link to="/logout">Logout</Link>
      </div>
      <br />

      {message && <div>{message}</div>}

      {!book && <div>Book not found</div>}

      {book && !isAdmin && (
        <table border="1" cellPadding="6">
          <tbody>
            <tr><th>Title</th><td>{book.title}</td></tr>
            <tr><th>Author</th><td>{book.author}</td></tr>
            <tr><th>Quantity</th><td>{book.quantity}</td></tr>
            <tr><th>Location</th><td>{book.location}</td></tr>
            <tr><th>Status</th><td>{book.status}</td></tr>
          </tbody>
        </table>
      )}

      {book && isAdmin && (
        <form onSubmit={onUpdate}>
          <table>
            <tbody>
              <tr>
                <th>Title</th>
                <td>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </td>
              </tr>
              <tr>
                <th>Author</th>
                <td>
                  <input
                    value={form.author}
                    onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                  />
                </td>
              </tr>
              <tr>
                <th>Quantity</th>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={form.quantity}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                  />
                </td>
              </tr>
              <tr>
                <th>Location</th>
                <td>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </td>
              </tr>
              <tr>
                <th>Status</th>
                <td>{book.status}</td>
              </tr>
            </tbody>
          </table>
          <button type="submit">Update</button>
          <button type="button" onClick={onDelete} style={{ marginLeft: 8 }}>
            Soft Delete
          </button>
        </form>
      )}
    </div>
  );
}
