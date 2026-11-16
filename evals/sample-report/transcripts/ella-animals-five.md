# Ella likes animals and puzzles

Result: pass

**system**
The child tapped their wand. The child's name is Ella. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Ella! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like animals.

**assistant**
Would you like a wooden animal set?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden animal set is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden animal set","reason":"You said you like animals."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.

**kid**
I like puzzles.

**assistant**
Would you like a wooden puzzle?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden puzzle is going on your list. That's two. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden puzzle","reason":"You said you like puzzles."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 2 items. Aim for 5.

**kid**
I like books.

**assistant**
Would you like picture books to share?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Picture books is going on your list. That's three. What else do you love doing?
Tools: add_to_wishlist({"item":"picture books","reason":"You said you like books."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 3 items. Aim for 5.

**kid**
I like drawing.

**assistant**
Would you like chunky crayons and paper?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Chunky crayons and paper is going on your list. That's four. What else do you love doing?
Tools: add_to_wishlist({"item":"chunky crayons and paper","reason":"You said you like drawing."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 4 items. Aim for 5.

**kid**
I like the garden.

**assistant**
Would you like a watering can for the garden?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Watering can is going on your list. That's five. Ella, we did it! Five wonderful things are on your list. It's on its way to Mum. You were brilliant.
Tools: add_to_wishlist({"item":"watering can","reason":"You said you like the garden."}), set_mood({"mood":"happy"}), set_leds({"color":"rainbow"}), finish_session({"reason":"complete","detail":"five items"})

**system**
Wishlist now has 5 items. Do the happy recap and say the list is on its way to Mum.

**worker**
Emailed Mum only (wishlist, sent).
