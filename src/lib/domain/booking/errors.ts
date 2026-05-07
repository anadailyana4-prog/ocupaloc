export class BookingError extends Error {
  code = "BOOKING_ERROR";

  constructor(message = "Booking error") {
    super(message);
    this.name = "BookingError";
  }
}

export class SlotConflictError extends BookingError {
  code = "SLOT_CONFLICT";

  constructor() {
    super("Slot already booked");
    this.name = "SlotConflictError";
  }
}

export class BlockedClientError extends BookingError {
  code = "CLIENT_BLOCKED";

  constructor() {
    super("Client is blocked");
    this.name = "BlockedClientError";
  }
}

export class NoSubscriptionError extends BookingError {
  code = "NO_SUBSCRIPTION";

  constructor() {
    super("No active subscription");
    this.name = "NoSubscriptionError";
  }
}