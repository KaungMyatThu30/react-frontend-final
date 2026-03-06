import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function Books () {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";

  const [books, setBooks] = useState([]);
  const [filters, setFilters] = useState({ title: "", author: "", includeDeleted: false });
  const [form, setForm] = useState({ title: "", author: "", quantity: 1, location: "" });
  const [message, setMessage] = useState("");

  const loadBooks = useCallback(async () => {
    const query = new URLSearchParams();
    if (filters.title) query.set("title", filters.title);
    if (filters.author) query.set("author", filters.author);
    if (isAdmin && filters.includeDeleted) query.set("includeDeleted", "true");

    const result = await fetch(`${API_URL}/api/books?${query.toString()}`, {
      credentials: "include",
    });
    if (!result.ok) {
      setMessage("Cannot load books");
      return;
    }
    const data = await result.json();
    setBooks(data);
  }, [API_URL, filters.author, filters.includeDeleted, filters.title, isAdmin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadBooks();
    }, 0);
    return () => clearTimeout(timer);
  }, [filters.includeDeleted, loadBooks]);

  const onSearch = async (e) => {
    e.preventDefault();
    setMessage("");
    await loadBooks();
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    const result = await fetch(`${API_URL}/api/books`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!result.ok) {
      const err = await result.json().catch(() => ({}));
      setMessage(err.message || "Create failed");
      return;
    }
    setForm({ title: "", author: "", quantity: 1, location: "" });
    setMessage("Book created");
    await loadBooks();
  };

  return (
    <div>
      <h2>Library Books</h2>
      <div>
        <span>User: {user?.email} ({user?.role})</span> | <Link to="/borrow">Borrow</Link> | <Link to="/logout">Logout</Link>
      </div>
      <br />

      <form onSubmit={onSearch}>
        <input
          placeholder="Filter title"
          value={filters.title}
          onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
        />
        <input
          placeholder="Filter author"
          value={filters.author}
          onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
        />
        <button type="submit">Search</button>
        {isAdmin && (
          <label style={{ marginLeft: 8 }}>
            <input
              type="checkbox"
              checked={filters.includeDeleted}
              onChange={(e) => setFilters((prev) => ({ ...prev, includeDeleted: e.target.checked }))}
            />
            Show deleted
          </label>
        )}
      </form>

      {isAdmin && (
        <form onSubmit={onCreate}>
          <h3>Create Book</h3>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            placeholder="Author"
            value={form.author}
            onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
          />
          <input
            placeholder="Quantity"
            type="number"
            min={0}
            value={form.quantity}
            onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
          />
          <button type="submit">Create</button>
        </form>
      )}

      {message && <div>{message}</div>}

      <table border="1" cellPadding="6" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Quantity</th>
            <th>Location</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book._id}>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.quantity}</td>
              <td>{book.location}</td>
              <td>{book.status}</td>
              <td><Link to={`/books/${book._id}`}>View</Link></td>
            </tr>
          ))}
          {!books.length && (
            <tr><td colSpan={6}>No books found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
