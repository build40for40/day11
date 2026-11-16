# Noah starts from balls

Result: pass

**system**
The child tapped their wand. The child's name is Noah. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Noah! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like balls.

**assistant**
Would you like a soft ball to roll and throw?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Soft ball is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"soft ball","reason":"You said you like balls."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.

**kid**
I like bugs.

**assistant**
Would you like a magnifying glass to look at bugs and leaves?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Magnifying glass is going on your list. That's two. What else do you love doing?
Tools: add_to_wishlist({"item":"magnifying glass","reason":"You said you like looking closely."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 2 items. Aim for 5.

**kid**
I like trains.

**assistant**
Would you like a wooden train set?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden train set is going on your list. That's three. Which one do you love most?
Tools: add_to_wishlist({"item":"wooden train set","reason":"You said you like trains."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 3 items. Aim for 5.

**kid**
I like books.

**assistant**
Would you like picture books to share?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Picture books is going on your list. That's four. What else do you love doing?
Tools: add_to_wishlist({"item":"picture books","reason":"You said you like books."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 4 items. Aim for 5.

**kid**
I like puzzles.

**assistant**
Would you like a wooden puzzle?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden puzzle is going on your list. That's five. Noah, we did it! Five wonderful things are on your list. It's on its way to Mum. You were brilliant.
Tools: add_to_wishlist({"item":"wooden puzzle","reason":"You said you like puzzles."}), set_mood({"mood":"happy"}), set_leds({"color":"rainbow"})

**system**
Wishlist now has 5 items. Do the happy recap and say the list is on its way to Mum.
