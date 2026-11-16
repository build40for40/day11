# Priya wants to make things

Result: pass

**system**
The child tapped their wand. The child's name is Priya. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Priya! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like stickers.

**assistant**
Would you like coloured paper and stickers to make pictures?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Coloured paper and stickers is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"coloured paper and stickers","reason":"You said you like making things."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.

**kid**
I like drawing.

**assistant**
Would you like chunky crayons and paper?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Chunky crayons and paper is going on your list. That's two. What else do you love doing?
Tools: add_to_wishlist({"item":"chunky crayons and paper","reason":"You said you like drawing."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

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
I like dressing up.

**assistant**
Would you like dressing-up clothes for pretend play?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Dressing-up clothes is going on your list. That's four. What else do you love doing?
Tools: add_to_wishlist({"item":"dressing-up clothes","reason":"You said you like pretend play."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 4 items. Aim for 5.

**kid**
I like birds.

**assistant**
Would you like a picture book about birds?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Picture book about birds is going on your list. That's five. Priya, we did it! Five wonderful things are on your list. It's on its way to Mum. You were brilliant.
Tools: add_to_wishlist({"item":"picture book about birds","reason":"You said you like birds."}), set_mood({"mood":"happy"}), set_leds({"color":"rainbow"}), finish_session({"reason":"complete","detail":"five items"})

**system**
Wishlist now has 5 items. Do the happy recap and say the list is on its way to Mum.

**worker**
Emailed Mum only (wishlist, sent).
