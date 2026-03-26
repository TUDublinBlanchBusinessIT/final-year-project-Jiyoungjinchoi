import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function PremiumPetInsights({
  pets = [],
  upcomingReminders = [],
  appointments = [],
  isPremium = false,
}) {
  const navigate = useNavigate();

  const totalPets = pets.length;

  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return (appointments || [])
      .filter((a) => {
        if (!a?.appointment_at) return false;
        const d = new Date(a.appointment_at);
        return !Number.isNaN(d.getTime()) && d >= now;
      })
      .sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at));
  }, [appointments]);

  const dueSoonReminders = useMemo(() => {
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    return (upcomingReminders || []).filter((r) => {
      if (!r?.reminder_date) return false;
      const d = new Date(r.reminder_date);
      return !Number.isNaN(d.getTime()) && d >= now && d <= threeDaysLater;
    });
  }, [upcomingReminders]);

  const careScore = useMemo(() => {
    let score = 55;

    if (totalPets > 0) score += 10;
    if (upcomingAppointments.length > 0) score += 15;
    if (upcomingReminders.length > 0) score += 10;
    if (dueSoonReminders.length === 0) score += 10;

    return Math.min(score, 100);
  }, [
    totalPets,
    upcomingAppointments.length,
    upcomingReminders.length,
    dueSoonReminders.length,
  ]);

  const nextAppointment = upcomingAppointments[0] || null;
  const nextReminder = upcomingReminders[0] || null;

  const insightItems = [
    {
      icon: "🐾",
      title: "Pet Profiles",
      value: totalPets,
      text:
        totalPets > 0
          ? `You are actively managing ${totalPets} pet${totalPets > 1 ? "s" : ""}.`
          : "Add your first pet profile to unlock a more personalised dashboard.",
      actionLabel: totalPets > 0 ? "Manage Pets" : "Add Pet",
      action: () => navigate(totalPets > 0 ? "/mypets" : "/pets/create"),
    },
    {
      icon: "📅",
      title: "Upcoming Visits",
      value: upcomingAppointments.length,
      text: nextAppointment
        ? "Your next appointment is scheduled soon. Stay prepared and organised."
        : "No upcoming appointments found. Book one when your pet needs care.",
      actionLabel: nextAppointment ? "View Appointments" : "Book Appointment",
      action: () =>
        navigate(nextAppointment ? "/appointments" : "/appointments/book"),
    },
    {
      icon: "⏰",
      title: "Reminders Due Soon",
      value: dueSoonReminders.length,
      text:
        dueSoonReminders.length > 0
          ? "You have reminders approaching in the next few days."
          : "No urgent reminders due soon. Everything looks calm right now.",
      actionLabel: "Open Reminders",
      action: () => navigate("/reminders"),
    },
    {
      icon: isPremium ? "⭐" : "🔒",
      title: "Premium Access",
      value: isPremium ? "ON" : "OFF",
      text: isPremium
        ? "You can access premium tools like Vet Chat and enhanced support."
        : "Upgrade to premium to unlock Vet Chat and premium guidance features.",
      actionLabel: isPremium ? "Open Vet Chat" : "Upgrade",
      action: () => navigate(isPremium ? "/vet-chat" : "/upgrade-premium"),
    },
  ];

  return (
    <article className="pfd-card pfd-card-board pfd-span-3">
      <div className="pfd-card-head">
        <div>
          <div className="pfd-card-kicker">Premium insights</div>
          <h2>Pet Care Insights</h2>
          <p>
            A simple overview of your pets, reminders, appointments, and premium
            access in one place.
          </p>
        </div>

        <button
          className="pfd-btn pfd-btn-small"
          onClick={() => navigate("/profile")}
        >
          Open Profile
        </button>
      </div>

      <div className="pfd-mini-list">
        <div className="pfd-mini-item">
          <div className="pfd-mini-item-icon">💡</div>
          <div className="pfd-mini-item-body">
            <div className="pfd-mini-item-title">Overall Care Score</div>
            <div className="pfd-mini-item-text">
              Based on your current pet profiles, reminders, and appointments.
            </div>
            <div className="pfd-mini-item-sub">{careScore}% organised</div>
          </div>
        </div>

        <div className="pfd-board-columns">
          <div className="pfd-board-column">
            <div className="pfd-reminder-list">
              {insightItems.slice(0, 2).map((item) => (
                <div key={item.title} className="pfd-reminder-row">
                  <div className="pfd-reminder-icon">{item.icon}</div>
                  <div className="pfd-reminder-meta" style={{ width: "100%" }}>
                    <div className="pfd-reminder-name">
                      {item.title}
                      <span style={{ marginLeft: "6px", opacity: 0.8 }}>
                        ({item.value})
                      </span>
                    </div>
                    <div className="pfd-reminder-desc">{item.text}</div>
                    <div style={{ marginTop: "10px" }}>
                      <button
                        className="pfd-btn pfd-btn-small"
                        onClick={item.action}
                      >
                        {item.actionLabel}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pfd-board-column">
            <div className="pfd-reminder-list">
              {insightItems.slice(2, 4).map((item) => (
                <div key={item.title} className="pfd-reminder-row">
                  <div className="pfd-reminder-icon">{item.icon}</div>
                  <div className="pfd-reminder-meta" style={{ width: "100%" }}>
                    <div className="pfd-reminder-name">
                      {item.title}
                      <span style={{ marginLeft: "6px", opacity: 0.8 }}>
                        ({item.value})
                      </span>
                    </div>
                    <div className="pfd-reminder-desc">{item.text}</div>
                    <div style={{ marginTop: "10px" }}>
                      <button
                        className="pfd-btn pfd-btn-small"
                        onClick={item.action}
                      >
                        {item.actionLabel}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pfd-mini-item">
          <div className="pfd-mini-item-icon">📌</div>
          <div className="pfd-mini-item-body">
            <div className="pfd-mini-item-title">Smart Summary</div>
            <div className="pfd-mini-item-text">
              {nextReminder
                ? `Your next care task is "${nextReminder.title}".`
                : "You currently have no upcoming reminder tasks."}
            </div>
            <div className="pfd-mini-item-sub">
              {nextAppointment
                ? "An appointment is also coming up soon."
                : "No future appointment is currently booked."}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}