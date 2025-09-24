-- Insert dummy meetings data with proper UUID for user_id
INSERT INTO public.meetings (id, title, description, meeting_date, status, user_id, participant_count) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Product Strategy Review', 'Quarterly review of product roadmap and strategic initiatives', '2024-01-15 10:00:00+00:00', 'completed', '550e8400-e29b-41d4-a716-446655440000', 8),
('550e8400-e29b-41d4-a716-446655440002', 'Sprint Planning Meeting', 'Planning session for upcoming development sprint', '2024-01-16 09:30:00+00:00', 'completed', '550e8400-e29b-41d4-a716-446655440000', 6),
('550e8400-e29b-41d4-a716-446655440003', 'Client Presentation', 'Quarterly business review with key client', '2024-01-17 14:00:00+00:00', 'completed', '550e8400-e29b-41d4-a716-446655440000', 12),
('550e8400-e29b-41d4-a716-446655440004', 'Team Standup', 'Weekly team synchronization meeting', '2024-01-18 09:00:00+00:00', 'completed', '550e8400-e29b-41d4-a716-446655440000', 5),
('550e8400-e29b-41d4-a716-446655440005', 'Q1 Budget Review', 'Review of Q1 budget allocations and expenses', '2024-01-19 11:00:00+00:00', 'upcoming', '550e8400-e29b-41d4-a716-446655440000', 10),
('550e8400-e29b-41d4-a716-446655440006', 'Marketing Campaign Planning', 'Planning session for upcoming marketing campaigns', '2024-01-22 13:00:00+00:00', 'upcoming', '550e8400-e29b-41d4-a716-446655440000', 7),
('550e8400-e29b-41d4-a716-446655440007', 'Engineering All-Hands', 'Monthly engineering team meeting', '2024-01-25 15:00:00+00:00', 'upcoming', '550e8400-e29b-41d4-a716-446655440000', 25);