"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "./auth";
import { supabase } from "./supabase";
import { getBookings } from "./data-service";
import { redirect } from "next/navigation";

export async function createBooking(prevState, formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const bookingData = JSON.parse(formData.get("bookingData"));

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
    extrasPrice: 0,
    totalPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: "unconfirmed",
  };

  const { error } = await supabase.from("Bookings").insert([newBooking]);

  if (error) {
    console.error(error);
    return { success: "Booking could not be created" };

    // throw new Error("Booking could not be created");
  }

  revalidatePath(`/cabins/${bookingData.cabinId}`);
  return { success: "Booking was succesfully created" };
  // redirect("/cabins/thank-you");
}

export async function editBooking(formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const { numGuests, observations, bookingId } = Object.fromEntries(
    formData.entries()
  );

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((booking) => booking.id);
  console.log(guestBookingsIds.includes(bookingId));
  if (!guestBookingsIds.includes(Number(bookingId)))
    throw new Error("You are not allowed to edit this reservation");

  const updatedFields = { numGuests, observations };

  const { data, error } = await supabase
    .from("Bookings")
    .update(updatedFields)
    .eq("id", bookingId)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be updated");
  }

  revalidatePath("/account/reservations");
  redirect("/account/reservations");
}

export async function deleteReservation(bookingId) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((booking) => booking.id);
  if (!guestBookingsIds.includes(bookingId))
    throw new Error("You are not allowed to delete this reservation");

  const { error } = await supabase
    .from("Bookings")
    .delete()
    .eq("id", bookingId);

  if (error) {
    throw new Error("Booking could not be deleted");
  }
  revalidatePath("/account/reservations");
}

export async function updateGuest(formData) {
  const session = await auth();
  if (!session) throw new Error("you must be logged in");

  const nationalID = formData.get("nationalID");

  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID))
    throw new Error("Please Provide a valid national ID");
  const updateData = { nationality, countryFlag, nationalID };

  const { data, error } = await supabase
    .from("Guests")
    .update(updateData)
    .eq("id", session.user.guestId);

  if (error) {
    console.error(error);
    throw new Error("Guest could not be updated");
  }
  revalidatePath("/account/profile");
}

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
