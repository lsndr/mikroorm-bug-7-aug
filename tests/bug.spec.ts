import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { MikroORM, FullTextType } from "@mikro-orm/postgresql";

@Entity()
export class DogEntity {
    @PrimaryKey({ autoincrement: false })
    id!: string;

    @Property()
    public name!: string;

    @Property<DogEntity>({
        type: new FullTextType('english'),
        onCreate: dog => dog.name,
        onUpdate: dog => dog.name,
    })
    public nameVector!: string;

    @Property({
        runtimeType: 'Date',
        columnType: 'timestamp',
        onUpdate: () => new Date(),
        onCreate: () => new Date()
      })
      public updatedAt!: Date;
}

describe('Bug', () => {
    let orm: MikroORM;

    beforeEach(async () => {
        orm = await MikroORM.init({
            entities: [DogEntity],
            clientUrl: 'postgresql://dev:dev@localhost:5432/dev',
            debug: true,
        });

        await orm.schema.refreshDatabase();
    });

    beforeEach(async () => {
        const em = orm.em.fork();

        const entity = new DogEntity();
        entity.id = '1';
        entity.name = 'Scooby Doo';

        await em.persistAndFlush(entity);
    });

    afterAll(async () => {
        await orm.close();
    });

    it('should not update entity', async () => {
        const em = orm.em.fork();

        // Load parent entity 
        const entity = await em.findOne(DogEntity, { id: '1' });
        const originalDate = entity?.updatedAt;

        // Pay attention to the logs, the entity gets updated
        await em.flush();

        // Date get also changed, because of the update
        expect(entity?.updatedAt).toEqual(originalDate);
    })
});