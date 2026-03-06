import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function BookBorrow() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user } = useUser();

  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ bookId: "", targetDate: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const [booksResponse, requestsResponse] = await Promise.all([
        fetch(`${API_URL}/api/books`, { credentials: "include" }),
        fetch(`${API_URL}/api/borrow`, { credentials: "include" }),
      ]);

      if (cancelled) {
        return;
      }

      if (!booksResponse.ok) {
        setMessage("Cannot load books");
      } else {
        const bookData = await booksResponse.json();
        setBooks(bookData.filter((book) => book.status !== "DELETED"));
      }

      if (!requestsResponse.ok) {
        setMessage((prev) => prev || "Cannot load requests");
      } else {
        const requestData = await requestsResponse.json();
        setRequests(requestData);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  const reloadData = async () => {
    const [booksResponse, requestsResponse] = await Promise.all([
      fetch(`${API_URL}/api/books`, { credentials: "include" }),
      fetch(`${API_URL}/api/borrow`, { credentials: "include" }),
    ]);

    if (booksResponse.ok) {
      const bookData = await booksResponse.json();
      setBooks(bookData.filter((book) => book.status !== "DELETED"));
    }

    if (requestsResponse.ok) {
      const requestData = await requestsResponse.json();
      setRequests(requestData);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.bookId || !form.targetDate) {
      setMessage("Please select book and target date");
      return;
    }

    const result = await fetch(`${API_URL}/api/borrow`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await result.json().catch(() => ({}));

    if (!result.ok) {
      setMessage(payload.message || "Borrow request failed");
      return;
    }

    const submittedStatus = payload.requestStatus || payload.status || "INIT";
    setMessage(`Borrow request submitted with status: ${submittedStatus}`);
    setForm({ bookId: "", targetDate: "" });
    await reloadData();
  };

  const canSubmitRequest = user?.role === "USER";

  return (
    <div>
      <h2>Borrow Service</h2>
      <div>
        <span>User: {user?.email} ({user?.role})</span> | <Link to="/books">Books</Link> | <Link to="/logout">Logout</Link>
      </div>
      <br />

      {canSubmitRequest && (
        <form onSubmit={onSubmit}>
          <h3>Submit Borrow Request</h3>
          <div>
            <select
              value={form.bookId}
              onChange={(e) => setForm((prev) => ({ ...prev, bookId: e.target.value }))}
            >
              <option value="">Select a book</option>
              {books.map((book) => (
                <option key={book._id} value={book._id}>
                  {book.title} - {book.author} (qty: {book.quantity})
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: 8 }}>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((prev) => ({ ...prev, targetDate: e.target.value }))}
            />
          </div>
          <button type="submit" style={{ marginTop: 8 }}>Submit</button>
        </form>
      )}

      {!canSubmitRequest && (
        <div>Only USER role can submit borrowing requests.</div>
      )}

      {message && <div style={{ marginTop: 10 }}>{message}</div>}

      <h3 style={{ marginTop: 14 }}>Borrow Requests</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Book</th>
            <th>Created At</th>
            <th>Target Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((item) => (
            <tr key={item._id}>
              <td>{item.userId}</td>
              <td>{item.bookTitle || item.bookId}</td>
              <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</td>
              <td>{item.targetDate ? new Date(item.targetDate).toLocaleDateString() : ""}</td>
              <td>{item.requestStatus || item.status || "INIT"}</td>
            </tr>
          ))}
          {!requests.length && (
            <tr><td colSpan={5}>No borrow requests</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
