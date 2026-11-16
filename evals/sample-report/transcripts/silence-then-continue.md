# One quiet moment, then the chat continues

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

**kid** [silence]

**system**
The child is quiet.

**assistant**
Are you still there?
Tools: set_mood({"mood":"thinking"})

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
