using ConstructionWidget.Core.Entities;

namespace ConstructionWidget.Core.Interfaces;

public interface ILeadNotificationService
{
    Task NotifyLeadAsync(Lead lead, Tenant tenant);
}
