# Yes to everything waits for a favourite

Result: pass

**system**
The child tapped their wand. The child's name is Freya. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Freya! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid** [yes-to-everything]
I like blocks.

**assistant** [yes-to-everything]
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

**kid**
I like puzzles.

**assistant**
Would you like a wooden puzzle?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden puzzle is going on your list. That's three. Which one do you love most?
Tools: add_to_wishlist({"item":"wooden puzzle","reason":"You said you like puzzles."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 3 items. Aim for 5.
