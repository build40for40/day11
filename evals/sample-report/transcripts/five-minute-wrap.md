# Five minutes wraps the chat up

Result: pass

**system**
The child tapped their wand. The child's name is Omar. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Omar! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like books.

**assistant**
Would you like picture books to share?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Picture books is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"picture books","reason":"You said you like books."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.

**kid**
um

**system**
Five minutes have passed. Wrap the session up now.

**assistant**
I'll stop here for now. Picture books is on your list. We can add more next time.
Tools: set_mood({"mood":"happy"}), set_leds({"color":"rainbow"}), finish_session({"reason":"timeout","detail":"five minutes"})

**worker**
Emailed Mum only (wishlist, sent).
