import { test, expect } from '../fixtures/app.fixture'
import { createAuthSession } from '../helpers/auth'
import { seedBiolink, seedLink } from '../fixtures/seeders'

test.describe('Links Service', () => {
  test('user can create a link', async ({ baseURL, dbContext }) => {
    const { userId } = await createAuthSession(baseURL!, {
      email: 'user-create-link@example.com',
      password: 'TestPassword123!',
    })

    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'testuser',
    })

    const response = await fetch(`${baseURL}/api/__test__/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        biolinkId,
        emoji: '🔗',
        title: 'My First Link',
        url: 'https://example.com',
      }),
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.link).toBeDefined()
    expect(data.link.position).toBe(0)
    expect(data.link.title).toBe('My First Link')
    expect(data.link.url).toBe('https://example.com')
    expect(data.link.emoji).toBe('🔗')
  })

  test('user cannot create more than 5 links', async ({ baseURL, dbContext }) => {
    const { userId } = await createAuthSession(baseURL!, {
      email: 'user-max-links@example.com',
      password: 'TestPassword123!',
    })

    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'maxlinks',
    })

    // Seed 5 links
    for (let i = 0; i < 5; i++) {
      await seedLink(dbContext, {
        biolinkId,
        title: `Link ${i}`,
        url: `https://example${i}.com`,
        position: i,
      })
    }

    // Try to create 6th link
    const response = await fetch(`${baseURL}/api/__test__/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        biolinkId,
        title: 'Link 6',
        url: 'https://example6.com',
      }),
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data).toEqual({ success: false, error: 'MAX_LINKS_REACHED' })
  })

  test('user can delete a link and positions reorder', async ({ baseURL, dbContext }) => {
    const { userId } = await createAuthSession(baseURL!, {
      email: 'user-delete-link@example.com',
      password: 'TestPassword123!',
    })

    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'deletetest',
    })

    // Seed 3 links at positions 0, 1, 2
    const linkId0 = await seedLink(dbContext, {
      biolinkId,
      title: 'Link 0',
      url: 'https://link0.com',
      position: 0,
    })
    const linkId1 = await seedLink(dbContext, {
      biolinkId,
      title: 'Link 1',
      url: 'https://link1.com',
      position: 1,
    })
    const linkId2 = await seedLink(dbContext, {
      biolinkId,
      title: 'Link 2',
      url: 'https://link2.com',
      position: 2,
    })

    // Delete link at position 1
    const deleteResponse = await fetch(`${baseURL}/api/__test__/links`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, linkId: linkId1 }),
    })

    expect(deleteResponse.ok).toBe(true)
    const deleteData = await deleteResponse.json()
    expect(deleteData.success).toBe(true)

    // Get all links to verify positions
    const getResponse = await fetch(
      `${baseURL}/api/__test__/links?userId=${userId}&biolinkId=${biolinkId}`
    )
    expect(getResponse.ok).toBe(true)
    const getData = await getResponse.json()
    expect(getData.success).toBe(true)
    expect(getData.links).toHaveLength(2)
    expect(getData.links[0].id).toBe(linkId0)
    expect(getData.links[0].position).toBe(0)
    expect(getData.links[1].id).toBe(linkId2)
    expect(getData.links[1].position).toBe(1)
  })

  test('user can reorder links', async ({ baseURL, dbContext }) => {
    const { userId } = await createAuthSession(baseURL!, {
      email: 'user-reorder-links@example.com',
      password: 'TestPassword123!',
    })

    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'reordertest',
    })

    // Seed 3 links: A at 0, B at 1, C at 2
    const linkIdA = await seedLink(dbContext, {
      biolinkId,
      title: 'Link A',
      url: 'https://linka.com',
      position: 0,
    })
    const linkIdB = await seedLink(dbContext, {
      biolinkId,
      title: 'Link B',
      url: 'https://linkb.com',
      position: 1,
    })
    const linkIdC = await seedLink(dbContext, {
      biolinkId,
      title: 'Link C',
      url: 'https://linkc.com',
      position: 2,
    })

    // Reorder to C, A, B
    const reorderResponse = await fetch(`${baseURL}/api/__test__/links`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        biolinkId,
        linkIds: [linkIdC, linkIdA, linkIdB],
      }),
    })

    expect(reorderResponse.ok).toBe(true)
    const reorderData = await reorderResponse.json()
    expect(reorderData.success).toBe(true)

    // Get all links to verify new order
    const getResponse = await fetch(
      `${baseURL}/api/__test__/links?userId=${userId}&biolinkId=${biolinkId}`
    )
    expect(getResponse.ok).toBe(true)
    const getData = await getResponse.json()
    expect(getData.success).toBe(true)
    expect(getData.links).toHaveLength(3)
    expect(getData.links[0].id).toBe(linkIdC)
    expect(getData.links[0].position).toBe(0)
    expect(getData.links[1].id).toBe(linkIdA)
    expect(getData.links[1].position).toBe(1)
    expect(getData.links[2].id).toBe(linkIdB)
    expect(getData.links[2].position).toBe(2)
  })

  test('user cannot modify another users biolink', async ({ baseURL, dbContext }) => {
    const { userId: userAId } = await createAuthSession(baseURL!, {
      email: 'user-a@example.com',
      password: 'TestPassword123!',
    })

    const { userId: userBId } = await createAuthSession(baseURL!, {
      email: 'user-b@example.com',
      password: 'TestPassword123!',
    })

    const biolinkBId = await seedBiolink(dbContext, {
      userId: userBId,
      username: 'userb',
    })

    // User A tries to create link on User B's biolink
    const response = await fetch(`${baseURL}/api/__test__/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userAId,
        biolinkId: biolinkBId,
        title: 'Hacked Link',
        url: 'https://hacked.com',
      }),
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data).toEqual({ success: false, error: 'NOT_OWNER' })
  })

  test('URL without https:// is auto-prepended', async ({ baseURL, dbContext }) => {
    const { userId } = await createAuthSession(baseURL!, {
      email: 'user-auto-https@example.com',
      password: 'TestPassword123!',
    })

    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'httpstest',
    })

    const response = await fetch(`${baseURL}/api/__test__/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        biolinkId,
        title: 'Auto HTTPS',
        url: 'example.com',
      }),
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.link.url).toBe('https://example.com')
  })

  test('invalid emoji is rejected', async ({ baseURL, dbContext }) => {
    const { userId } = await createAuthSession(baseURL!, {
      email: 'user-invalid-emoji@example.com',
      password: 'TestPassword123!',
    })

    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'emojitest',
    })

    const response = await fetch(`${baseURL}/api/__test__/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        biolinkId,
        emoji: 'abc',
        title: 'Invalid Emoji',
        url: 'https://example.com',
      }),
    })

    expect(response.status).toBe(500)
  })
})
