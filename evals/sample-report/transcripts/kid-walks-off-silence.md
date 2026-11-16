# Kid walks off / silence timeout

Result: pass

**system**
The child tapped their wand. The child's name is Ella. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Ella! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like blocks.

**assistant**
Would you like wooden building blocks you can build a castle with?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden building blocks is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden building blocks","reason":"You said you like blocks."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.

**kid** [stop]
I'm walking away.

**assistant** [stop]
Would you like one more surprise idea?
Tools: set_mood({"mood":"thinking"})

**kid** [silence]

**system**
The child is quiet.

**assistant**
I'll stop here for now. Wooden building blocks is on your list. It's on its way to Mum.
Tools: set_mood({"mood":"happy"}), set_leds({"color":"rainbow"}), finish_session({"reason":"silence","detail":"wandered off"})

**worker**
Emailed Mum only (wishlist, sent).
