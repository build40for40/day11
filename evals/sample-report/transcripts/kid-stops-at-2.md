# Kid stops at 2

Result: pass

**system**
The child tapped their wand. The child's name is Sam. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Sam! I'm Aunty Bella. What's the best thing you've played with lately?
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

**kid**
I like drums.

**assistant**
Would you like a small drum you can tap?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Small drum is going on your list. That's two. What else do you love doing?
Tools: add_to_wishlist({"item":"small drum","reason":"You said you like music."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 2 items. Aim for 5.

**kid** [stop]
I'm done.

**assistant** [stop]
Would you like one more surprise idea?
Tools: set_mood({"mood":"thinking"})

**kid**
No.

**assistant**
Sam, you found two lovely things. Wooden building blocks and small drum are on your list. It's on its way to Mum. You were brilliant.
Tools: set_mood({"mood":"happy"}), set_leds({"color":"rainbow"}), finish_session({"reason":"kid_done","detail":"the child said no to one more"})

**worker**
Emailed Mum only (wishlist, sent).
