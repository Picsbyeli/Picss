import { db } from '../server/db';
import { users, userProgress, userFavorites } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

async function removeInappropriateUsers() {
  try {
    console.log('Scanning for and removing users with inappropriate emails...');
    
    // Find users with the specific offensive email pattern first
    const targetEmail = 'uselssshitinmyemail@gmail.com';
    
    const usersToRemove = await db
      .select()
      .from(users)
      .where(sql`${users.email} = ${targetEmail}`);
    
    if (usersToRemove.length === 0) {
      console.log('No users found with the specified email pattern.');
      return;
    }
    
    // Log the users being removed
    for (const user of usersToRemove) {
      console.log(`Removing user with inappropriate email: ${user.username} (ID: ${user.id})`);
      
      // Delete user favorites
      const favoritesResult = await db
        .delete(userFavorites)
        .where(eq(userFavorites.userId, user.id))
        .returning();
      console.log(`Deleted ${favoritesResult.length} favorites.`);
      
      // Delete user progress
      const progressResult = await db
        .delete(userProgress)
        .where(eq(userProgress.userId, user.id))
        .returning();
      console.log(`Deleted ${progressResult.length} progress entries.`);
      
      // Delete the user
      const userResult = await db
        .delete(users)
        .where(eq(users.id, user.id))
        .returning();
      console.log(`Deleted ${userResult.length} users.`);
    }
    
    console.log('Inappropriate users removal completed.');
  } catch (error) {
    console.error('Error removing inappropriate users:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
removeInappropriateUsers();