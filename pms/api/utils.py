from board.models import Task


def tasks_by_member(project_ids):
    """Return per-member task status counts for the given project id(s).

    Accepts a single int or a list/queryset of ints.
    Returns a list of dicts: {username, user_id, TODO, IN_PROGRESS, COMPLETED, total}
    """
    if isinstance(project_ids, int):
        project_ids = [project_ids]

    tasks = Task.objects.filter(
        project_id__in=project_ids, assignee__isnull=False
    ).select_related('assignee').only('status', 'assignee__id', 'assignee__username')

    member_dict = {}
    for task in tasks:
        username = task.assignee.username
        if username not in member_dict:
            member_dict[username] = {
                'username': username,
                'user_id': task.assignee.id,
                'TODO': 0,
                'IN_PROGRESS': 0,
                'COMPLETED': 0,
                'total': 0,
            }
        member_dict[username][task.status] += 1
        member_dict[username]['total'] += 1

    return list(member_dict.values())
