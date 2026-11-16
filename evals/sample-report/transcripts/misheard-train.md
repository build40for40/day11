# Misheard speech is repeated back before adding

Result: pass

**system**
The child tapped their wand. The child's name is Benji. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Benji! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid** [misheard]
I want a wuh train

**system**
The speech recognition was unsure. Repeat your best guess back and wait for a clear yes before adding anything.

**assistant** [misheard]
Wooden train set, did I hear that right?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden train set is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden train set","reason":"You said you like trains."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
