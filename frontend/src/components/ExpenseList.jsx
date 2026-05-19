// Renders the (already filtered) expense list. Edit/Delete call back to
// the Dashboard which owns the data + API calls.
export default function ExpenseList({ expenses, onEdit, onDelete }) {
  if (expenses.length === 0) {
    return <p className="muted empty">No expenses match your search.</p>;
  }

  return (
    <div className="expense-grid">
      {expenses.map((exp) => (
        <article key={exp._id} className="expense-card">
          <div className="expense-card-head">
            <h3>{exp.title}</h3>
            <span className={`tag tag-${exp.category.toLowerCase()}`}>{exp.category}</span>
          </div>
          <p className="amount">${Number(exp.amount).toFixed(2)}</p>
          <p className="muted">{exp.date}</p>
          {exp.description && <p className="desc">{exp.description}</p>}
          <div className="button-row">
            <button className="btn btn-small" onClick={() => onEdit(exp)}>
              Edit
            </button>
            <button
              className="btn btn-small btn-danger"
              onClick={() => onDelete(exp)}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
